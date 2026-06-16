using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using ResumeAnalyzer.Models.DTOs;

namespace ResumeAnalyzer.Services;

public class AIAnalysisService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _model;

    public AIAnalysisService(IConfiguration config, IHttpClientFactory httpClientFactory)
    {
        _httpClient = httpClientFactory.CreateClient();
        _apiKey = config["OpenRouter:ApiKey"]!;
        _model = config["OpenRouter:Model"]!;
    }

    public async Task<AnalysisResult> AnalyzeResumeAsync(string resumeText, string jobDescription)
    {
        var prompt = $@"You are an expert resume analyzer. Analyze the resume against the job description and return your response ONLY as valid JSON.

Resume:
{resumeText}

Job Description:
{jobDescription}

Return ONLY this JSON structure (no markdown, no explanation):
{{
  ""matchScore"": <integer 0-100>,
  ""matchedSkills"": [""skill1"", ""skill2"", ""skill3""],
  ""missingSkills"": [""skill1"", ""skill2""],
  ""suggestions"": [""suggestion1"", ""suggestion2"", ""suggestion3""],
  ""summary"": ""2-3 sentence overall assessment""
}}

Rules:
- matchScore: Percentage match (0-100) based on how well resume fits the job
- matchedSkills: 5-10 skills from resume that match job requirements
- missingSkills: 3-7 important skills from job description missing in resume
- suggestions: 3-5 specific actionable recommendations
- summary: Brief overall assessment of fit

Return ONLY the JSON object:";

        var requestBody = new
        {
            model = _model,
            messages = new[]
            {
                new { role = "user", content = prompt }
            },
            reasoning = new { enabled = false },
            temperature = 0.7,
            max_tokens = 2000
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "https://openrouter.ai/api/v1/chat/completions")
        {
            Content = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json")
        };

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);

        var response = await _httpClient.SendAsync(request);

        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            throw new Exception($"OpenRouter API error: {response.StatusCode} - {errorContent}");
        }

        var responseContent = await response.Content.ReadAsStringAsync();
        var openRouterResponse = JsonSerializer.Deserialize<OpenRouterResponse>(responseContent);

        if (openRouterResponse?.Choices == null || openRouterResponse.Choices.Count == 0)
        {
            throw new Exception("OpenRouter returned empty response");
        }

        var aiResponse = openRouterResponse.Choices[0].Message.Content;

        // Clean up potential markdown
        var jsonResponse = CleanJsonResponse(aiResponse);

        // Parse AI response
        try
        {
            var result = JsonSerializer.Deserialize<AnalysisResult>(jsonResponse,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (result == null)
                throw new Exception("Deserialization returned null");

            // Validate and clean
            result.MatchScore = Math.Clamp(result.MatchScore, 0, 100);
            result.MatchedSkills ??= new List<string>();
            result.MissingSkills ??= new List<string>();
            result.Suggestions ??= new List<string>();
            result.Summary ??= "Analysis completed";

            // Ensure we have some content
            if (result.MatchedSkills.Count == 0)
                result.MatchedSkills.Add("General development experience");
            
            if (result.MissingSkills.Count == 0)
                result.MissingSkills.Add("Consider highlighting more specific technical skills");

            if (result.Suggestions.Count == 0)
            {
                result.Suggestions.Add("Add measurable achievements with specific numbers");
                result.Suggestions.Add("Include relevant certifications");
                result.Suggestions.Add("Highlight projects that demonstrate required skills");
            }

            return result;
        }
        catch (JsonException ex)
        {
            // If JSON parsing completely fails, log and return basic analysis
            Console.WriteLine($"JSON Parse Error: {ex.Message}");
            Console.WriteLine($"Response was: {jsonResponse}");
            
            // Fallback to keyword-based analysis
            return CreateFallbackAnalysis(resumeText, jobDescription);
        }
    }

    private string CleanJsonResponse(string response)
    {
        if (string.IsNullOrEmpty(response))
            return "{}"; // Return empty JSON object or string.Empty as needed
        response = response.Trim();

        // Remove markdown code blocks
        if (response.StartsWith("```json"))
        {
            response = response.Replace("```json", "").Replace("```", "").Trim();
        }
        else if (response.StartsWith("```"))
        {
            response = response.Replace("```", "").Trim();
        }

        // Find JSON object boundaries
        var startIndex = response.IndexOf('{');
        var endIndex = response.LastIndexOf('}');

        if (startIndex >= 0 && endIndex > startIndex)
        {
            response = response.Substring(startIndex, endIndex - startIndex + 1);
        }

        return response;
    }

    private AnalysisResult CreateFallbackAnalysis(string resumeText, string jobDescription)
    {

        Console.WriteLine("Using fallback analysis");
        var resumeLower = resumeText.ToLower();
        var jobLower = jobDescription.ToLower();

        var skills = new[] { 
            ".net", "c#", "sql", "azure", "docker", "kubernetes", 
            "microservices", "api", "angular", "react", "entity framework", 
            "postgresql", "python", "java", "javascript", "ci/cd"
        };

        var matched = skills.Where(s => resumeLower.Contains(s) && jobLower.Contains(s))
            .Select(s => char.ToUpper(s[0]) + s.Substring(1))
            .ToList();

        var missing = skills.Where(s => !resumeLower.Contains(s) && jobLower.Contains(s))
            .Select(s => char.ToUpper(s[0]) + s.Substring(1))
            .ToList();

        var score = matched.Count > 0 
            ? (int)((matched.Count * 100.0) / (matched.Count + missing.Count))
            : 60;

        return new AnalysisResult
        {
            MatchScore = score,
            MatchedSkills = matched.Any() ? matched : new List<string> { "General programming experience" },
            MissingSkills = missing.Any() ? missing : new List<string> { "No major gaps identified" },
            Suggestions = new List<string>
            {
                "Quantify achievements with specific metrics",
                "Add relevant certifications if available",
                "Highlight technologies explicitly mentioned in job description"
            },
            Summary = $"Resume shows {score}% match based on keyword analysis. " +
                     $"Found {matched.Count} matching skills."
        };
    }

    // Response models
    private class OpenRouterResponse
    {
        [JsonPropertyName("choices")]
        public List<Choice> Choices { get; set; } = new();
    }

    private class Choice
    {
        [JsonPropertyName("message")]
        public Message Message { get; set; } = new();
    }

    private class Message
    {
        [JsonPropertyName("content")]
        public string Content { get; set; } = "";

        [JsonPropertyName("reasoning_details")]
        public object? ReasoningDetails { get; set; }
    }

    public async Task<string> ImproveResumeAsync(string resumeText, List<string> suggestions)
    {
        var suggestionsList = string.Join("\n- ", suggestions);
        var prompt = $@"You are an expert executive resume writer and ATS optimization specialist. 
Your task is to completely rewrite the following resume to seamlessly incorporate the provided improvement suggestions.

Guidelines for your rewrite:
1. Format it as a highly professional, ATS-friendly resume.
2. The top of the resume MUST start directly with the candidate's name and contact information (do NOT add a title like 'Resume' or 'Improved Resume').
3. Use clear, standard section headings in ALL CAPS (e.g., SUMMARY, SKILLS, EXPERIENCE, EDUCATION).
4. Make the bullet points punchy, action-oriented, and heavily quantified using metrics where appropriate.
5. Integrate the improvement suggestions naturally into the experience and skills sections.
6. Do not invent entirely new companies or degrees, but you may infer realistic responsibilities and technical skills based on the candidate's existing background and the suggestions.
7. Output ONLY the final resume text. Do not include any conversational filler, markdown formatting blocks (like ```), or explanatory notes.

Original Resume:
{resumeText}

Improvement Suggestions:
- {suggestionsList}

Return ONLY the improved resume text:";

        var requestBody = new
        {
            model = _model,
            messages = new[]
            {
                new { role = "user", content = prompt }
            },
            reasoning = new { enabled = false },
            temperature = 0.7,
            max_tokens = 3000
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "https://openrouter.ai/api/v1/chat/completions")
        {
            Content = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json")
        };

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);

        var response = await _httpClient.SendAsync(request);

        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            throw new Exception($"OpenRouter API error: {response.StatusCode} - {errorContent}");
        }

        var responseContent = await response.Content.ReadAsStringAsync();
        var openRouterResponse = JsonSerializer.Deserialize<OpenRouterResponse>(responseContent);

        if (openRouterResponse?.Choices == null || openRouterResponse.Choices.Count == 0)
        {
            throw new Exception("OpenRouter returned empty response");
        }

        return openRouterResponse.Choices[0].Message.Content.Trim();
    }
}
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ResumeAnalyzer.Data;
using ResumeAnalyzer.Models;
using ResumeAnalyzer.Services;

namespace ResumeAnalyzer.API.Controllers;

[ApiController]
[Route("api/resume")]
[Authorize]
public class ResumeController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly BlobService _blobService;
    private readonly ResumeParserService _parser;
    private readonly AIAnalysisService _aiService;
    public ResumeController(
        AppDbContext db,
        BlobService blobService,
        ResumeParserService parser,
        AIAnalysisService aiService)
    {
        _db = db;
        _blobService = blobService;
        _parser = parser;
        _aiService=aiService;
    }

    private int UserId => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file uploaded" });

        if (file.ContentType != "application/pdf")
            return BadRequest(new { message = "Only PDF files are allowed" });

        if (file.Length > 10 * 1024 * 1024) // 10MB limit
            return BadRequest(new { message = "File too large. Maximum 10MB" });

        // Upload file
        var blobUrl = await _blobService.UploadAsync(file);

        // Extract text from PDF
        using var stream = file.OpenReadStream();
        var extractedText = _parser.ExtractTextFromPdf(stream);

        // Save to database
        var resume = new Resume
        {
            UserId = UserId,
            FileName = file.FileName,
            BlobUrl = blobUrl,
            ExtractedText = extractedText
        };

        _db.Resumes.Add(resume);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            id = resume.Id,
            fileName = resume.FileName,
            uploadedAt = resume.UploadedAt,
            textLength = extractedText.Length,
            preview = extractedText.Length > 200 
                ? extractedText.Substring(0, 200) + "..." 
                : extractedText
        });
    }

    [HttpGet]
    public async Task<IActionResult> GetMyResumes()
    {
        var resumes = await _db.Resumes
            .Where(r => r.UserId == UserId)
            .OrderByDescending(r => r.UploadedAt)
            .Select(r => new
            {
                r.Id,
                r.FileName,
                r.UploadedAt,
                TextLength = r.ExtractedText.Length
            })
            .ToListAsync();

        return Ok(resumes);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetResume(int id)
    {
        var resume = await _db.Resumes
            .Where(r => r.Id == id && r.UserId == UserId)
            .FirstOrDefaultAsync();

        if (resume == null)
            return NotFound();

        return Ok(new
        {
            resume.Id,
            resume.FileName,
            resume.UploadedAt,
            resume.ExtractedText
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteResume(int id)
    {
        var resume = await _db.Resumes
            .Where(r => r.Id == id && r.UserId == UserId)
            .FirstOrDefaultAsync();

        if (resume == null)
            return NotFound();

        _db.Resumes.Remove(resume);
        await _db.SaveChangesAsync();

        return NoContent();
    }

[HttpPost("analyze")]
public async Task<IActionResult> Analyze([FromBody] AnalyzeDto dto)
{
    // Get resume
    var resume = await _db.Resumes
        .Where(r => r.Id == dto.ResumeId && r.UserId == UserId)
        .FirstOrDefaultAsync();

    if (resume == null)
        return NotFound(new { message = "Resume not found" });

    // Get job description
    var jobDesc = await _db.JobDescriptions
        .Where(j => j.Id == dto.JobDescriptionId && j.UserId == UserId)
        .FirstOrDefaultAsync();

    if (jobDesc == null)
        return NotFound(new { message = "Job description not found" });

    // Call AI analysis
    var aiResult = await _aiService.AnalyzeResumeAsync(
        resume.ExtractedText,
        jobDesc.Content);

    // Save analysis to database
    var analysis = new Analysis
    {
        ResumeId = dto.ResumeId,
        JobDescriptionId = dto.JobDescriptionId,
        MatchScore = aiResult.MatchScore,
        MatchedSkills = aiResult.MatchedSkills,
        MissingSkills = aiResult.MissingSkills,
        Suggestions = aiResult.Suggestions,
        AISummary = aiResult.Summary
    };

    _db.Analyses.Add(analysis);
    await _db.SaveChangesAsync();

    return Ok(new
    {
        analysis.Id,
        analysis.MatchScore,
        analysis.MatchedSkills,
        analysis.MissingSkills,
        analysis.Suggestions,
        analysis.AISummary,
        analysis.AnalyzedAt,
        Resume = new { resume.FileName },
        JobDescription = new { jobDesc.Title, jobDesc.Company }
    });
}

[HttpGet("analyses")]
public async Task<IActionResult> GetMyAnalyses()
{
    var analyses = await _db.Analyses
        .Include(a => a.Resume)
        .Include(a => a.JobDescription)
        .Where(a => a.Resume.UserId == UserId)
        .OrderByDescending(a => a.AnalyzedAt)
        .Select(a => new
        {
            a.Id,
            a.MatchScore,
            a.MatchedSkills,
            a.MissingSkills,
            a.Suggestions,
            a.AISummary,
            a.AnalyzedAt,
            Resume = new { a.Resume.FileName },
            JobDescription = new { a.JobDescription.Title, a.JobDescription.Company }
        })
        .ToListAsync();

    return Ok(analyses);
}
}


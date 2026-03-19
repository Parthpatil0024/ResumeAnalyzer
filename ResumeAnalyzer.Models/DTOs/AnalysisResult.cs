public class AnalysisResult
{
    public int MatchScore { get; set; }
    public List<string> MatchedSkills { get; set; } = new();
    public List<string> MissingSkills { get; set; } = new();
    public List<string> Suggestions { get; set; } = new();
    public string Summary { get; set; } = string.Empty;
}
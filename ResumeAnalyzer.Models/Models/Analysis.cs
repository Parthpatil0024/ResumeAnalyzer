namespace ResumeAnalyzer.Models;
public class Analysis
{
    public int Id { get; set; }
    public int ResumeId { get; set; }
    public int JobDescriptionId { get; set; }
    public int MatchScore { get; set; }
    public List<string> MatchedSkills{get; set;}=new();
    public List<string> MissingSkills{get; set;}=new();
    public List<string> Suggestions{get; set;}=new();
    public string AISummary{get; set;}= string.Empty;
    public DateTime AnalyzedAt { get; set; }= DateTime.UtcNow;
    public Resume Resume { get; set; } = null!;
    public JobDescription JobDescription { get; set; } = null!;
}
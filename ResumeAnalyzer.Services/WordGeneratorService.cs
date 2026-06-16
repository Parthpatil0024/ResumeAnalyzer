using Xceed.Document.NET;
using Xceed.Words.NET;

namespace ResumeAnalyzer.Services;

public class WordGeneratorService
{
    public byte[] GenerateResumeWord(string resumeText)
    {
        using var stream = new MemoryStream();
        using (var document = DocX.Create(stream))
        {
            // Set nice margins
            document.MarginLeft = 50;
            document.MarginRight = 50;
            document.MarginTop = 50;
            document.MarginBottom = 50;

            var lines = resumeText.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
            
            bool isFirstLine = true;
            bool isContactInfo = false;

            for (int i = 0; i < lines.Length; i++)
            {
                var line = lines[i].Trim();
                if (string.IsNullOrWhiteSpace(line)) continue;

                if (isFirstLine)
                {
                    // Candidate Name
                    var p = document.InsertParagraph(line);
                    p.Font("Arial").FontSize(24).Bold().Color(Xceed.Drawing.Color.DarkBlue).Alignment = Alignment.center;
                    isFirstLine = false;
                    isContactInfo = true;
                }
                else if (isContactInfo && !line.ToUpper().Equals(line) && !line.StartsWith("-") && !line.StartsWith("*"))
                {
                    // Contact info
                    var p = document.InsertParagraph(line);
                    p.Font("Arial").FontSize(11).Color(Xceed.Drawing.Color.DimGray).Alignment = Alignment.center;
                    p.SpacingAfter(10);
                }
                else if (line.ToUpper() == line && line.Length > 3) // Section Heading
                {
                    isContactInfo = false;
                    document.InsertParagraph("").SpacingBefore(10); // Spacing
                    
                    var p = document.InsertParagraph(line);
                    p.Font("Arial").FontSize(14).Bold().Color(Xceed.Drawing.Color.DarkBlue);
                    
                    // Bottom border hack - Xceed has InsertHorizontalLine but sometimes it behaves weirdly.
                    // Another way is to just use standard bold text and maybe a tiny line below.
                    // We'll stick to formatting it boldly with a different color.
                    p.SpacingAfter(5);
                }
                else if (line.StartsWith("-") || line.StartsWith("*")) // Bullet point
                {
                    isContactInfo = false;
                    var text = line.Substring(1).Trim();
                    var p = document.InsertParagraph($"•  {text}");
                    p.Font("Arial").FontSize(11);
                    p.IndentationBefore = 36f; // approx 0.5 inch
                    p.IndentationFirstLine = -18f; // hanging indent
                    p.SpacingAfter(3);
                }
                else
                {
                    // Normal text (like company name or role)
                    isContactInfo = false;
                    var p = document.InsertParagraph(line);
                    p.Font("Arial").FontSize(11).Bold();
                    p.SpacingAfter(3);
                }
            }

            document.Save();
        }

        return stream.ToArray();
    }
}

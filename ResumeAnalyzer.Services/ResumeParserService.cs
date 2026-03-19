using UglyToad.PdfPig;
using System.Text;

namespace ResumeAnalyzer.Services;

public class ResumeParserService{
    public string ExtractTextFromPdf(Stream pdfStream){
        var text=new StringBuilder();
        using var document=PdfDocument.Open(pdfStream);
        foreach(var page in document.GetPages()){
            text.AppendLine(page.Text);
        }

        return text.ToString().Trim();
    }
}
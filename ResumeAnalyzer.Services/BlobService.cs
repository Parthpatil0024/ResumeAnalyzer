using Microsoft.AspNetCore.Http;

namespace ResumeAnalyzer.Services;

public class BlobService{
    
    private readonly string _uploadPath;

    public BlobService(){
        _uploadPath=Path.Combine(Directory.GetCurrentDirectory(),"uploads");
        Directory.CreateDirectory(_uploadPath);
    }

    public async Task<string> UploadAsync(IFormFile file){
        var fileName=$"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var filePath=Path.Combine(_uploadPath, fileName);

        using var stream=new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        return $"/uploads/{fileName}";
    }

     public async Task<Stream> DownloadAsync(string blobUrl)
    {
        // Extract filename from URL like "/uploads/abc-123.pdf"
        var fileName = Path.GetFileName(blobUrl);
        var filePath = Path.Combine(_uploadPath, fileName);

        if (!File.Exists(filePath))
            throw new FileNotFoundException("Resume file not found");

        var memoryStream = new MemoryStream();
        using var fileStream = File.OpenRead(filePath);
        await fileStream.CopyToAsync(memoryStream);
        memoryStream.Position = 0;
        return memoryStream;
    }
}
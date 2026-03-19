namespace ResumeAnalyzer.Models.DTOs
{
    public class AuthResponse
    {
        public string Token { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }

        public AuthResponse(string token, string name, string email)
        {
            Token = token;
            Name = name;
            Email = email;
        }
    }
}
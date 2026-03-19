
using Microsoft.AspNetCore.Mvc;
using ResumeAnalyzer.Models.DTOs;
using ResumeAnalyzer.Services;
using Microsoft.EntityFrameworkCore;
namespace ResumeAnalyzer.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var user = await _authService.RegisterAsync(dto.Email, dto.Password, dto.Name);
        if (user == null)
            return BadRequest(new { message = "Email already exists" });

        var token = _authService.GenerateToken(user);
        return Ok(new AuthResponse(token, user.Name, user.Email));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await _authService.LoginAsync(dto.Email, dto.Password);
        if (user == null)
            return Unauthorized(new { message = "Invalid credentials" });

        var token = _authService.GenerateToken(user);
        return Ok(new AuthResponse(token, user.Name, user.Email));
    }
}


using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ResumeAnalyzer.Data;
using ResumeAnalyzer.Models;
using ResumeAnalyzer.Models.DTOs;

namespace ResumeAnalyzer.API.Controllers;

[ApiController]
[Route("api/jobs")]
[Authorize]
public class JobController : ControllerBase
{
    private readonly AppDbContext _db;

    public JobController(AppDbContext db)
    {
        _db = db;
    }

    private int UserId => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateJobDto dto)
    {
        var job = new JobDescription
        {
            UserId = UserId,
            Title = dto.Title,
            Company = dto.Company,
            Content = dto.Content
        };

        _db.JobDescriptions.Add(job);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            job.Id,
            job.Title,
            job.Company,
            job.CreatedAt,
            ContentLength = job.Content.Length
        });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var jobs = await _db.JobDescriptions
            .Where(j => j.UserId == UserId)
            .OrderByDescending(j => j.CreatedAt)
            .Select(j => new
            {
                j.Id,
                j.Title,
                j.Company,
                j.CreatedAt,
                ContentLength = j.Content.Length
            })
            .ToListAsync();

        return Ok(jobs);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var job = await _db.JobDescriptions
            .Where(j => j.Id == id && j.UserId == UserId)
            .FirstOrDefaultAsync();

        if (job == null)
            return NotFound();

        return Ok(job);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var job = await _db.JobDescriptions
            .Where(j => j.Id == id && j.UserId == UserId)
            .FirstOrDefaultAsync();

        if (job == null)
            return NotFound();

        _db.JobDescriptions.Remove(job);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}


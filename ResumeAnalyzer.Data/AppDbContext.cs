using Microsoft.EntityFrameworkCore;
using ResumeAnalyzer.Models;

namespace ResumeAnalyzer.Data;


public class AppDbContext:DbContext
{
  public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Resume> Resumes { get; set; }
    public DbSet<JobDescription> JobDescriptions { get; set; }
    public DbSet<Analysis> Analyses { get; set; }

    protected override void OnModelCreating(ModelBuilder mb)
    {
        base.OnModelCreating(mb);

        // PostgreSQL uses JSONB for better performance with JSON data
        // Store lists as JSONB (PostgreSQL native JSON type)
        
        mb.Entity<Analysis>()
            .Property(a => a.MatchedSkills)
            .HasColumnType("jsonb");  // PostgreSQL JSONB type

        mb.Entity<Analysis>()
            .Property(a => a.MissingSkills)
            .HasColumnType("jsonb");

        mb.Entity<Analysis>()
            .Property(a => a.Suggestions)
            .HasColumnType("jsonb");

        // Indexes for better query performance
        mb.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        mb.Entity<Resume>()
            .HasIndex(r => r.UserId);

        mb.Entity<Analysis>()
            .HasIndex(a => a.ResumeId);

        mb.Entity<Analysis>()
            .HasIndex(a => a.JobDescriptionId);

        // Table naming conventions (PostgreSQL prefers lowercase with underscores)
        mb.Entity<User>().ToTable("users");
        mb.Entity<Resume>().ToTable("resumes");
        mb.Entity<JobDescription>().ToTable("job_descriptions");
        mb.Entity<Analysis>().ToTable("analyses");
    }


}

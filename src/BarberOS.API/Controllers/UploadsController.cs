using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarberOS.API.Controllers;

/// <summary>
/// Local-disk image uploads (avatars, post images). Files are served back as static
/// content from wwwroot/uploads — fine for the single-host deployment this app targets.
/// </summary>
[ApiController]
[Route("api/v1/uploads")]
[Authorize]
public sealed class UploadsController(IWebHostEnvironment env) : ControllerBase
{
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/webp", "image/gif",
    };

    private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

    [HttpPost("image")]
    [RequestSizeLimit(MaxFileSizeBytes)]
    public async Task<IActionResult> UploadImage(IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { title = "No se recibió ningún archivo." });

        if (file.Length > MaxFileSizeBytes)
            return BadRequest(new { title = "La imagen no puede superar 5 MB." });

        if (!AllowedContentTypes.Contains(file.ContentType))
            return BadRequest(new { title = "Formato de imagen no soportado. Usa JPG, PNG, WEBP o GIF." });

        var extension = file.ContentType switch
        {
            "image/jpeg" => ".jpg",
            "image/png" => ".png",
            "image/webp" => ".webp",
            "image/gif" => ".gif",
            _ => ".jpg",
        };

        var fileName = $"{Guid.CreateVersion7()}{extension}";
        var uploadsDir = Path.Combine(env.WebRootPath ?? "wwwroot", "uploads");
        Directory.CreateDirectory(uploadsDir);

        var fullPath = Path.Combine(uploadsDir, fileName);
        await using var stream = new FileStream(fullPath, FileMode.Create);
        await file.CopyToAsync(stream, ct);

        return Ok(new { url = $"/uploads/{fileName}" });
    }
}

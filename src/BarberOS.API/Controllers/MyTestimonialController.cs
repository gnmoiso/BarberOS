using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Testimonials.Commands.UpsertTestimonial;
using BarberOS.Application.Testimonials.Queries.GetMyTestimonial;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BarberOS.API.Controllers;

/// <summary>"Mi Testimonio" — a barbershop writes/edits its own opinion about the platform.
/// Max one per barbershop; SuperAdmin reviews every create/edit before it goes public (23.20.11).</summary>
[ApiController]
[Route("api/v1/my-testimonial")]
[Authorize(Roles = "Barber")]
public sealed class MyTestimonialController(ISender sender) : ControllerBase
{
    private Guid TenantId => Guid.Parse(User.FindFirstValue("tenant_id")!);

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct) =>
        Ok(await sender.Send(new GetMyTestimonialQuery(TenantId), ct));

    [HttpPut]
    public async Task<IActionResult> Upsert([FromBody] UpsertTestimonialRequest req, CancellationToken ct)
    {
        await sender.Send(new UpsertTestimonialCommand(TenantId, req.Content, req.AuthorName, req.BarbershipName), ct);
        return NoContent();
    }
}

public sealed record UpsertTestimonialRequest(string Content, string AuthorName, string BarbershipName);

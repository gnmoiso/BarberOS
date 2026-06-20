using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.SuperAdmin.Queries.ListTestimonials;
using Microsoft.AspNetCore.Mvc;

namespace BarberOS.API.Controllers;

[ApiController]
[Route("api/v1/testimonials")]
public sealed class TestimonialsController(ISender sender) : ControllerBase
{
    [HttpGet("home")]
    public async Task<IActionResult> ForHome(CancellationToken ct) =>
        Ok(await sender.Send(new ListTestimonialsQuery(ShowOnHomeOnly: true), ct));

    [HttpGet("login")]
    public async Task<IActionResult> ForLogin(CancellationToken ct) =>
        Ok(await sender.Send(new ListTestimonialsQuery(ShowOnLoginOnly: true), ct));
}

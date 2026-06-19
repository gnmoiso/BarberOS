using BarberOS.Application.Abstractions.Messaging;
using BarberOS.Application.Customers.Commands.CreateCustomer;
using BarberOS.Application.Customers.Queries.ListCustomers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarberOS.API.Controllers;

[ApiController]
[Route("api/v1/customers")]
[Authorize]
public sealed class CustomersController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? q, [FromQuery] int page = 1, [FromQuery] int size = 20, CancellationToken ct = default) =>
        Ok(await sender.Send(new ListCustomersQuery(q, page, size), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCustomerRequest req, CancellationToken ct)
    {
        var response = await sender.Send(
            new CreateCustomerCommand(req.FullName, req.Phone, req.Email, req.WhatsappPhone), ct);
        return CreatedAtAction(nameof(List), new { }, response);
    }
}

public sealed record CreateCustomerRequest(string FullName, string Phone, string? Email, string? WhatsappPhone);

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BarberOS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkScheduleBreaks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<TimeOnly>(
                name: "BreakEnd",
                table: "work_schedules",
                type: "time without time zone",
                nullable: true);

            migrationBuilder.AddColumn<TimeOnly>(
                name: "BreakStart",
                table: "work_schedules",
                type: "time without time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BreakEnd",
                table: "work_schedules");

            migrationBuilder.DropColumn(
                name: "BreakStart",
                table: "work_schedules");
        }
    }
}

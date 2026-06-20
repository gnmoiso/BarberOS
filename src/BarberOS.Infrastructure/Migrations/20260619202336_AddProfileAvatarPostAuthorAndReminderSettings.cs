using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BarberOS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProfileAvatarPostAuthorAndReminderSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AvatarUrl",
                table: "users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DisplayName",
                table: "users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AuthorId",
                table: "posts",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<int>(
                name: "ReminderMinutesBeforeAppointment",
                table: "barbership_settings",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvatarUrl",
                table: "users");

            migrationBuilder.DropColumn(
                name: "DisplayName",
                table: "users");

            migrationBuilder.DropColumn(
                name: "AuthorId",
                table: "posts");

            migrationBuilder.DropColumn(
                name: "ReminderMinutesBeforeAppointment",
                table: "barbership_settings");
        }
    }
}

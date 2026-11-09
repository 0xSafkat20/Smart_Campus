using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolAdmission.Api.Domain;

namespace SchoolAdmission.Api.Data.Configurations;

public sealed class AdmissionHoldConfiguration : IEntityTypeConfiguration<AdmissionHold>
{
    public void Configure(EntityTypeBuilder<AdmissionHold> builder)
    {
        builder.ToTable("holds", tableBuilder =>
        {
            tableBuilder.HasCheckConstraint(
                "ck_holds_student_id_format",
                "\"student_id\" ~ '^[0-9]{17}$'");
            tableBuilder.HasCheckConstraint(
                "ck_holds_expiry_after_creation",
                "\"expires_at\" > \"created_at\"");
            tableBuilder.HasCheckConstraint(
                "ck_holds_status_valid",
                "\"status\" IN ('HELD', 'CONFIRMED', 'EXPIRED', 'CANCELLED')");
        });

        builder.HasKey(hold => hold.Id);

        builder.Property(hold => hold.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        builder.Property(hold => hold.ClassId)
            .HasColumnName("class_id")
            .IsRequired();

        builder.Property(hold => hold.StudentId)
            .HasColumnName("student_id")
            .HasMaxLength(17)
            .IsFixedLength()
            .IsRequired();

        builder.Property(hold => hold.Status)
            .HasColumnName("status")
            .HasMaxLength(16)
            .HasConversion(
                status => status.ToString().ToUpperInvariant(),
                value => Enum.Parse<HoldStatus>(value, true))
            .IsRequired();

        builder.Property(hold => hold.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(hold => hold.ExpiresAt)
            .HasColumnName("expires_at")
            .IsRequired();

        builder.Property(hold => hold.ConfirmedAt)
            .HasColumnName("confirmed_at");

        builder.Property(hold => hold.CancelledAt)
            .HasColumnName("cancelled_at");

        builder.HasOne(hold => hold.Class)
            .WithMany(admissionClass => admissionClass.Holds)
            .HasForeignKey(hold => hold.ClassId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(hold => new { hold.ClassId, hold.Status, hold.ExpiresAt })
            .HasDatabaseName("ix_holds_class_status_expiry");

        builder.HasIndex(hold => new { hold.ClassId, hold.StudentId })
            .HasDatabaseName("ux_holds_class_student_active")
            .HasFilter("\"status\" IN ('HELD', 'CONFIRMED')")
            .IsUnique();
    }
}

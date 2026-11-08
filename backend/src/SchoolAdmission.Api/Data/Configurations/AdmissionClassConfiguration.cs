using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolAdmission.Api.Domain;

namespace SchoolAdmission.Api.Data.Configurations;

public sealed class AdmissionClassConfiguration : IEntityTypeConfiguration<AdmissionClass>
{
    public void Configure(EntityTypeBuilder<AdmissionClass> builder)
    {
        builder.ToTable("classes", tableBuilder =>
        {
            tableBuilder.HasCheckConstraint(
                "ck_classes_total_seats_positive",
                "\"total_seats\" > 0");
            tableBuilder.HasCheckConstraint(
                "ck_classes_name_not_blank",
                "length(btrim(\"name\")) > 0");
        });

        builder.HasKey(admissionClass => admissionClass.Id);

        builder.Property(admissionClass => admissionClass.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        builder.Property(admissionClass => admissionClass.Name)
            .HasColumnName("name")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(admissionClass => admissionClass.TotalSeats)
            .HasColumnName("total_seats")
            .IsRequired();

        builder.Property(admissionClass => admissionClass.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();
    }
}

using CarShare.DAL.Models;
using Microsoft.EntityFrameworkCore;

namespace CarShare.DAL.Data
{
    public class CarShareDbContext : DbContext
    {
        public CarShareDbContext(DbContextOptions<CarShareDbContext> options) : base(options)
        {
        }

        // DbSets for all entities
        public DbSet<User> Users { get; set; }
        public DbSet<Car> Cars { get; set; }
        public DbSet<CarImage> CarImages { get; set; }
        public DbSet<RentalProposal> RentalProposals { get; set; }
        public DbSet<Rental> Rentals { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<CarFeature> CarFeatures { get; set; }
        public DbSet<CarFeatureMapping> CarFeatureMappings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure enum conversions
            modelBuilder.Entity<User>()
                .Property(u => u.Role)
                .HasConversion<string>()
                .HasMaxLength(20);

            modelBuilder.Entity<Car>()
                .Property(c => c.Transmission)
                .HasConversion<string>()
                .HasMaxLength(20);

            modelBuilder.Entity<Car>()
                .Property(c => c.RentalStatus)
                .HasConversion<string>()
                .HasMaxLength(20);

            modelBuilder.Entity<Car>()
                .Property(c => c.CarType)
                .HasConversion<string>()
                .HasMaxLength(30);

            modelBuilder.Entity<Car>()
                .Property(c => c.FuelType)
                .HasConversion<string>()
                .HasMaxLength(20);

            modelBuilder.Entity<RentalProposal>()
                .Property(r => r.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            modelBuilder.Entity<Rental>()
                .Property(r => r.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            // Configure relationships
            // User -> Cars (One-to-Many)
            modelBuilder.Entity<User>()
                .HasMany(u => u.OwnedCars)
                .WithOne(c => c.Owner)
                .HasForeignKey(c => c.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Car -> CarImages (One-to-Many)
            modelBuilder.Entity<Car>()
                .HasMany(c => c.CarImages)
                .WithOne(i => i.Car)
                .HasForeignKey(i => i.CarId)
                .OnDelete(DeleteBehavior.Cascade);

            // Car -> RentalProposals (One-to-Many)
            modelBuilder.Entity<Car>()
                .HasMany(c => c.RentalProposals)
                .WithOne(r => r.Car)
                .HasForeignKey(r => r.CarId)
                .OnDelete(DeleteBehavior.Restrict);

            // User -> RentalProposals (One-to-Many)
            modelBuilder.Entity<User>()
                .HasMany(u => u.RentalProposals)
                .WithOne(r => r.Renter)
                .HasForeignKey(r => r.RenterId)
                .OnDelete(DeleteBehavior.Restrict);

            // RentalProposal -> Rental (One-to-One)
            modelBuilder.Entity<RentalProposal>()
                .HasOne(r => r.Rental)
                .WithOne(r => r.Proposal)
                .HasForeignKey<Rental>(r => r.ProposalId)
                .OnDelete(DeleteBehavior.Cascade);

            // Rental -> Review (One-to-One)
            modelBuilder.Entity<Rental>()
                .HasOne(r => r.Review)
                .WithOne(r => r.Rental)
                .HasForeignKey<Review>(r => r.RentalId)
                .OnDelete(DeleteBehavior.Cascade);

            // User -> Notifications (One-to-Many)
            modelBuilder.Entity<User>()
                .HasMany(u => u.Notifications)
                .WithOne(n => n.User)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure many-to-many: Car <-> Feature
            modelBuilder.Entity<CarFeatureMapping>()
                .HasKey(cf => new { cf.CarId, cf.FeatureId });

            modelBuilder.Entity<CarFeatureMapping>()
                .HasOne(cf => cf.Car)
                .WithMany(c => c.CarFeatureMappings)
                .HasForeignKey(cf => cf.CarId);

            modelBuilder.Entity<CarFeatureMapping>()
                .HasOne(cf => cf.Feature)
                .WithMany(f => f.CarFeatureMappings)
                .HasForeignKey(cf => cf.FeatureId);

            // Configure indexes for performance
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => new { u.Role, u.IsVerified });

            modelBuilder.Entity<Car>()
                .HasIndex(c => c.OwnerId);

            modelBuilder.Entity<Car>()
                .HasIndex(c => new { c.Brand, c.Model, c.Year, c.RentalStatus, c.IsApproved });

            modelBuilder.Entity<RentalProposal>()
                .HasIndex(r => new { r.StartDate, r.EndDate });

            modelBuilder.Entity<Review>()
                .HasIndex(r => r.Rating);

            modelBuilder.Entity<User>()
            .Property(u => u.PasswordHash)
            .IsRequired();

            modelBuilder.Entity<User>()
                .Property(u => u.PasswordSalt)
                .IsRequired();
        }
    }
}
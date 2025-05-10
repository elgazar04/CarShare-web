using CarShare.DAL.Data;
using CarShare.DAL.Models;

namespace CarShare.DAL.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {
        // Core Entities
        IRepository<User> Users { get; }
        IRepository<Car> Cars { get; }
        IRepository<RentalProposal> RentalProposals { get; }
        IRepository<Rental> Rentals { get; }
        IRepository<Review> Reviews { get; }

        // Specialized Repositories
        ICarRepository CarRepository { get; }
        CarShareDbContext Context { get; }


        Task<int> CommitAsync();
    }
}
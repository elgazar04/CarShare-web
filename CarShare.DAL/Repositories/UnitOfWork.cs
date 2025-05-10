using CarShare.DAL.Data;
using CarShare.DAL.Interfaces;
using CarShare.DAL.Models;
using Microsoft.EntityFrameworkCore;

namespace CarShare.DAL.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly CarShareDbContext _context;
        private bool _disposed;

        // Lazy-loaded repositories
        private IRepository<User> _users;
        private IRepository<Car> _cars;
        private IRepository<RentalProposal> _rentalProposals;
        private IRepository<Rental> _rentals;
        private IRepository<Review> _reviews;
        private ICarRepository _carRepository;

        public UnitOfWork(CarShareDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        public IRepository<User> Users => _users ??= new Repository<User>(_context);
        public IRepository<Car> Cars => _cars ??= new Repository<Car>(_context);
        public IRepository<RentalProposal> RentalProposals => _rentalProposals ??= new Repository<RentalProposal>(_context);
        public IRepository<Rental> Rentals => _rentals ??= new Repository<Rental>(_context);
        public IRepository<Review> Reviews => _reviews ??= new Repository<Review>(_context);
        public ICarRepository CarRepository => _carRepository ??= new CarRepository(_context);
        public CarShareDbContext Context => _context;


        public async Task<int> CommitAsync()
            => await _context.SaveChangesAsync();

        protected virtual void Dispose(bool disposing)
        {
            if (!_disposed && disposing)
            {
                _context.Dispose();
            }
            _disposed = true;
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }
    }
}
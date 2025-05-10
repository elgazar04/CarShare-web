using CarShare.DAL.Data;
using CarShare.DAL.Enums;
using CarShare.DAL.Interfaces;
using CarShare.DAL.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CarShare.DAL.Repositories
{
    public class CarRepository : Repository<Car>, ICarRepository
    {
        private readonly CarShareDbContext _context;  // Specific DbContext type

        public CarRepository(CarShareDbContext context) : base(context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        public async Task<IEnumerable<Car>> GetAvailableCarsAsync(DateTime startDate, DateTime endDate)
        {
            return await _context.Cars
                .Include(c => c.CarImages)
                .Include(c => c.Owner)  // If you need owner data
                .Where(c => c.RentalStatus == Enums.RentalStatus.Available)
                .Where(c => c.IsApproved)
                .Where(c => !c.RentalProposals.Any(rp =>
                    rp.Status == Enums.ProposalStatus.Accepted &&
                    rp.StartDate <= endDate &&
                    rp.EndDate >= startDate))
                .ToListAsync();
        }

        public async Task<IEnumerable<Car>> GetCarsByOwnerAsync(Guid ownerId)
        {
            return await _context.Cars
                .Include(c => c.Owner)
                .Include(c => c.CarImages)  // Include related data
                .Where(c => c.OwnerId == ownerId)
                .ToListAsync();
        }


        public async Task<IEnumerable<Car>> SearchCarsAsync(string searchTerm, decimal? maxPrice)
        {
            var query = _context.Cars
                .Include(c => c.CarImages)
                .Include(c => c.Owner)  // If needed
                .Where(c => c.IsApproved);

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                query = query.Where(c =>
                    c.Brand.Contains(searchTerm) ||
                    c.Model.Contains(searchTerm) ||
                    c.Description.Contains(searchTerm));
            }

            if (maxPrice.HasValue)
            {
                query = query.Where(c => c.PricePerDay <= maxPrice.Value);
            }

            return await query.ToListAsync();
        }
    }
}
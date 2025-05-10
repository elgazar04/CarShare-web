namespace CarShare.BLL.DTOs.Car
{
    public class CarResponseDTO
    {
        public Guid CarId { get; set; }
        public string Title { get; set; }
        public string Brand { get; set; }
        public string Model { get; set; }
        public int Year { get; set; }
        public decimal PricePerDay { get; set; }
        public string Location { get; set; }
        public string Transmission { get; set; }
        public string RentalStatus { get; set; }
        public List<string> ImageUrls { get; set; } = new();
        public string? OwnerName { get; set; }
        public Guid OwnerId { get; set; }
        public OwnerDTO? CarOwner { get; set; }
    }
    
    public class OwnerDTO
    {
        public Guid OwnerId { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
    }
}
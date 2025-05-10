using System.ComponentModel.DataAnnotations;

namespace CarShare.BLL.DTOs.Car
{
    public class CarCreateDTO
    {
        [Required]
        public string Title { get; set; }

        public string? Description { get; set; }

        [Required]
        public string CarType { get; set; }

        [Required]
        public string Brand { get; set; }

        [Required]
        public string Model { get; set; }

        [Required]
        public int Year { get; set; }

        [Required]
        public string Transmission { get; set; }

        [Required]
        public decimal PricePerDay { get; set; }

        [Required]
        public string Location { get; set; }

        [Required]
        public string LicensePlate { get; set; }
    }
}
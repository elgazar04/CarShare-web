namespace CarShare.BLL.DTOs.Car
{
    public class CarSearchDTO
    {
        public string? Brand { get; set; }
        public decimal? MaxPrice { get; set; }
        public string? Transmission { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }
}
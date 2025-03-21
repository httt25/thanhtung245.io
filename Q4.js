d3.csv("data_new.csv").then(function(data) {
    
    console.log("Dữ liệu:", data);
    
    if (!data || data.length === 0) {
        console.log("Dữ liệu không hợp lệ hoặc không có.");
        return;
    }
  
    const daysOfWeek = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];
    
    function getDayOfWeek(dateString) {
        const date = new Date(dateString);
        const day = date.getDay(); // Get day of the week (0: Chủ Nhật, 1: Thứ Hai, ..., 6: Thứ Bảy)
        
        const adjustedDay = (day === 0) ? 6 : day - 1;  // Điều chỉnh ngày Chủ Nhật (0) thành 6 (Chủ Nhật)
        
        return daysOfWeek[adjustedDay];  // Return name of the day
    }
  
    data.forEach(d => {
        d["Ngày trong tuần"] = getDayOfWeek(d["Thời gian tạo đơn"]);
    });
  
    console.log(data);
  
    const width = 900;
    const height = 500;
    const margin = { top: 40, right: 30, bottom: 40, left: 50 };
    
    const svg = d3.select("#chart")
        .attr("width", width)
        .attr("height", height);
    
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
    
    const x = d3.scaleBand()
        .domain(daysOfWeek)
        .range([0, width - margin.left - margin.right])
        .padding(0.2);
    
    const y = d3.scaleLinear()
        .domain([0, 15000000])
        .nice()
        .range([height - margin.top - margin.bottom, 0]);
  
    g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(x));
  
    g.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y)
              .ticks(6)
              .tickFormat(d => (d / 1000000) + "M"));
  
    const salesByDay = daysOfWeek.map(day => {
      const dayData = data.filter(d => d["Ngày trong tuần"] === day);
      const totalSales = d3.sum(dayData, d => d["Thành tiền"]);
      const distinctDays = new Set(dayData.map(d => d["Thời gian tạo đơn"].split(' ')[0]));
      const avgSales = totalSales / distinctDays.size;
      
      return { key: day, avgSales: avgSales };
    });
  
    console.log("Doanh thu trung bình theo ngày trong tuần:", salesByDay);
  
    const colorScale = d3.scaleOrdinal()
        .domain(daysOfWeek)
        .range(d3.schemeCategory10);
  
    salesByDay.sort((a, b) => daysOfWeek.indexOf(a.key) - daysOfWeek.indexOf(b.key));
  
    g.selectAll(".bar")
        .data(salesByDay)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.key))
        .attr("y", d => y(d.avgSales))
        .attr("width", x.bandwidth())
        .attr("height", d => height - margin.top - margin.bottom - y(d.avgSales))
        .attr("fill", d => colorScale(d.key));
  
    g.selectAll(".label")
        .data(salesByDay)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => x(d.key) + x.bandwidth() / 2)
        .attr("y", d => y(d.avgSales) - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(d => d3.format(",.0f")(d.avgSales) + " VND");
});

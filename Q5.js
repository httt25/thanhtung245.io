d3.csv("data_new.csv").then(function(data) {
    
    console.log("Dữ liệu:", data);
    
    if (!data || data.length === 0) {
        console.log("Dữ liệu không hợp lệ hoặc không có.");
        return;
    }

    // Tạo một mảng ngày trong tháng từ "Ngày 01" đến "Ngày 31"
    const daysOfMonth = Array.from({ length: 31 }, (_, i) => `Ngày ${String(i + 1).padStart(2, '0')}`);
    
    // Tạo một hàm để tính doanh số trung bình theo ngày trong tháng
    function calculateAverageSales(day) {
        const dayData = data.filter(d => {
            const date = new Date(d["Thời gian tạo đơn"]);
            return date.getDate() === day;
        });
        const totalSales = d3.sum(dayData, d => d["Thành tiền"]);
        const distinctDays = new Set(dayData.map(d => d["Thời gian tạo đơn"].split(' ')[0]));  // Lấy ngày (YYYY-MM-DD)
        return totalSales / distinctDays.size;
    }

    // Tính doanh thu trung bình cho từng ngày trong tháng
    const salesByDay = daysOfMonth.map((day, index) => {
        const dayNumber = index + 1;  // Ngày trong tháng (1-31)
        const avgSales = calculateAverageSales(dayNumber);
        return { key: day, avgSales: avgSales };
    });

    console.log("Doanh thu trung bình theo ngày trong tháng:", salesByDay);

    // Tạo vùng vẽ biểu đồ
    const width = 900;
    const height = 500;
    const margin = { top: 40, right: 30, bottom: 100, left: 50 };  // Thêm khoảng cách dưới cho trục X
    
    const svg = d3.select("#chart")
        .attr("width", width)
        .attr("height", height);
    
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
    
    // Tạo các tỷ lệ trục
    const x = d3.scaleBand()
        .domain(daysOfMonth)
        .range([0, width - margin.left - margin.right])
        .padding(0.3);
    
    const y = d3.scaleLinear()
        .domain([0, 16000000])  // Cố định khoảng từ 0M đến 16M
        .range([height - margin.top - margin.bottom, 0]);

    // Thêm trục X
    g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", "12px")  // Giảm kích thước font cho các ngày
        .attr("transform", "rotate(-45)") // Quay các nhãn trục X để dễ đọc
        .style("text-anchor", "end")
        .attr("dx", "-1.2em")  // Dịch ra xa trục một chút
        .attr("dy", "1.5em");  // Dịch xuống chút nữa để nhãn không bị chồng lên nhau

    // Thêm trục Y với khoảng 2M
    g.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y)
              .ticks(8)  // Chia trục Y thành 8 khoảng (0M, 2M, ..., 16M)
              .tickFormat(d => (d / 1000000) + "M"));  // Hiển thị đơn vị triệu

    // Sắp xếp doanh thu theo ngày trong tháng
    salesByDay.sort((a, b) => a.key.localeCompare(b.key));

    // Vẽ các cột
    g.selectAll(".bar")
        .data(salesByDay)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.key))
        .attr("y", d => y(d.avgSales))
        .attr("width", x.bandwidth())
        .attr("height", d => height - margin.top - margin.bottom - y(d.avgSales))
        .attr("fill", (d, i) => d3.schemeCategory10[i % 10]);  // Dùng màu sắc khác nhau cho mỗi ngày

    // Thêm label giá trị trên đỉnh cột với đơn vị "tr"
    g.selectAll(".label")
        .data(salesByDay)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => x(d.key) + x.bandwidth() / 2)  // Căn giữa nhãn trên cột
        .attr("y", d => y(d.avgSales) - 10)  // Đặt label trên đỉnh cột
        .attr("text-anchor", "middle")
        .style("font-size", "9px")
        .text(d => d3.format(",.1f")(d.avgSales / 1000000) + " tr");  // Hiển thị giá trị dạng triệu và thêm "tr"

});

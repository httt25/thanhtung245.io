d3.csv("data_new.csv").then(function(data) {

    // Hàm xử lý thời gian và lấy khung giờ
    function getTimeRange(time) {
        const date = new Date(time);  // Chuyển đổi chuỗi ngày giờ thành đối tượng Date
        const hour = date.getHours();  // Lấy giờ
        const start = Math.floor(hour / 1) * 1;
        const end = start + 1;
        return `${start.toString().padStart(2, '0')}:00-${end.toString().padStart(2, '0')}:59`;  // Định dạng khung giờ
    }

    // Nhóm các đơn hàng theo khung giờ và ngày
    const salesByHour = Array.from(
        d3.group(data, d => getTimeRange(d["Thời gian tạo đơn"])),  // Nhóm theo khung giờ
        ([key, values]) => {
            // Lấy tất cả các ngày duy nhất cho khung giờ này
            const uniqueDays = new Set(values.map(d => new Date(d["Thời gian tạo đơn"]).toLocaleDateString()));
            // Tính tổng doanh thu cho khung giờ này
            const totalSales = d3.sum(values, d => d["Thành tiền"]);
            // Tính doanh thu trung bình cho mỗi ngày
            return {
                key,
                value: totalSales / uniqueDays.size  // Chia tổng doanh thu cho số ngày duy nhất
            };
        }
    );

    // Sắp xếp các khung giờ
    const hours = salesByHour.map(d => d.key);
    const sales = salesByHour.map(d => d.value);

    // Thiết lập kích thước và lề của biểu đồ
    const width = 900;
    const height = 500;
    const margin = { top: 40, right: 30, bottom: 100, left: 50 };

    const svg = d3.select("#chart")
        .attr("width", width)
        .attr("height", height);

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Tạo trục X (Khung giờ)
    const x = d3.scaleBand()
        .domain(hours)
        .range([0, width - margin.left - margin.right])
        .padding(0.4);

    // Tạo trục Y (Doanh số bán hàng trung bình)
    const y = d3.scaleLinear()
        .domain([0, d3.max(sales) * 1.1])  // Dự phòng cho giá trị cao nhất
        .range([height - margin.top - margin.bottom, 0]);

    // Thêm trục X
    g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", "10px")
        .attr("transform", "rotate(-45)")  // Quay nhãn trục X
        .style("text-anchor", "end");

    // Thêm trục Y
    g.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => (d / 1000) + "K"));

    // Thêm tiêu đề
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Doanh số bán hàng trung bình theo Khung giờ");

    // Vẽ các cột (bars)
    g.selectAll(".bar")
        .data(salesByHour)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.key))
        .attr("y", d => y(d.value))
        .attr("width", x.bandwidth())
        .attr("height", d => height - margin.top - margin.bottom - y(d.value))
        .attr("fill", (d, i) => d3.schemePaired[i % 10]);  // Màu sắc cho từng khung giờ

    // Thêm label giá trị trên đỉnh cột
    g.selectAll(".label")
        .data(salesByHour)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => x(d.key) + x.bandwidth() / 2)
        .attr("y", d => y(d.value) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "8px")
        .text(d => d3.format(",.0f")(d.value) + " VND");  // Định dạng giá trị và thêm "VND"
}).catch(function(error) {
    console.error("Lỗi khi tải dữ liệu: ", error);
});

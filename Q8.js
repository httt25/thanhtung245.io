// Load data and process
const parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");

// Đọc dữ liệu từ file CSV
d3.csv("data_new.csv").then(function(data) {
    // Chuyển đổi các cột dữ liệu
    data.forEach(d => {
        d.date = parseDate(d["Thời gian tạo đơn"]);
        d.month = d3.timeFormat("%m")(d.date); // Chỉ lấy tháng
        d.yearMonth = d3.timeFormat("%Y-%m")(d.date); // Lấy năm-tháng
        d.group = `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`; // Nhóm hàng
        d.SL = +d["SL"]; // Chuyển SL thành số
    });

    // Tổng số đơn hàng theo từng tháng
    let totalOrdersByMonth = d3.rollup(
        data,
        v => new Set(v.map(d => d["Mã đơn hàng"])).size, // Đếm số lượng "Mã đơn hàng" duy nhất
        d => d.yearMonth
    );

    // Tính số lượng "Mã nhóm hàng" cho mỗi nhóm và tháng, và count distinct "Mã đơn hàng" (SL)
    let groupData = d3.rollup(
        data,
        v => ({
            count: new Set(v.map(d => d["Mã đơn hàng"])).size, // Số đơn hàng duy nhất của nhóm
            totalSL: new Set(v.map(d => d["Mã đơn hàng"])).size // SL là count distinct "Mã đơn hàng"
        }),
        d => d.yearMonth,
        d => d.group
    );

    // Xử lý dữ liệu để tính xác suất bán hàng theo nhóm hàng và tháng
    let processedData = [];
    groupData.forEach((groups, yearMonth) => {
        groups.forEach((values, group) => {
            processedData.push({
                month: yearMonth.split('-')[1], // Lấy tháng
                group: group,
                count: values.count,
                totalSL: values.totalSL, // SL là count distinct "Mã đơn hàng"
                probability: (values.count / totalOrdersByMonth.get(yearMonth)) * 100 // Tính xác suất
            });
        });
    });

    // Nhóm dữ liệu theo tên nhóm hàng
    let nestedData = d3.groups(processedData, d => d.group);

    let width = 1000, height = 500, margin = { top: 50, right: 200, bottom: 40, left: 60 };
    let svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Định nghĩa trục X và Y
    let x = d3.scaleBand()
        .domain([...new Set(processedData.map(d => d.month))]) // Tháng
        .range([0, width - margin.left - margin.right])
        .padding(0.1);

    let y = d3.scaleLinear()
        .domain([0, d3.max(processedData, d => d.probability)]) // Tỷ lệ phần trăm
        .range([height - margin.top - margin.bottom, 0]);

    // Màu sắc cho mỗi nhóm hàng
    let color = d3.scaleOrdinal(d3.schemeTableau10)
        .domain(nestedData.map(d => d[0]));

    // Định nghĩa line function
    let line = d3.line()
        .x(d => x(d.month) + x.bandwidth() / 2)
        .y(d => y(d.probability));

    // Tạo tooltip để hiển thị chi tiết
    let tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("pointer-events", "none");

    // Vẽ các đường cho mỗi nhóm
    nestedData.forEach(group => {
        svg.append("path")
            .datum(group[1])
            .attr("fill", "none")
            .attr("stroke", color(group[0]))
            .attr("stroke-width", 2)
            .attr("d", line);

        // Vẽ các điểm (dot) cho mỗi nhóm hàng
        svg.selectAll(".dot")
            .data(group[1])
            .enter().append("circle")
            .attr("cx", d => x(d.month) + x.bandwidth() / 2)
            .attr("cy", d => y(d.probability))
            .attr("r", 5)
            .attr("fill", color(group[0]))
            .on("click", (event, d) => {
                tooltip.transition().duration(200).style("opacity", .9);
                tooltip.html(`
                    <b>Nhóm hàng:</b> ${d.group}<br>
                    <b>Tháng:</b> Tháng ${d.month}<br>
                    <b>Xác suất bán hàng:</b> ${d.probability.toFixed(1)}%<br>
                    <b>SL:</b> ${d.totalSL} <!-- SL là count distinct Mã đơn hàng -->
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", () => tooltip.transition().duration(500).style("opacity", 0));
    });

    // Thêm trục X
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d => `Tháng ${d}`));

    // Thêm trục Y
    svg.append("g")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`));

    // Legend
    let legend = svg.append("g")
        .attr("transform", `translate(${width - margin.right}, ${margin.top})`);

    nestedData.forEach((group, i) => {
        let legendRow = legend.append("g")
            .attr("transform", `translate(0, ${i * 30})`);

        legendRow.append("rect")
            .attr("width", 14)
            .attr("height", 14)
            .attr("fill", color(group[0]))
            .attr("stroke", "black")
            .attr("stroke-width", 0.5);

        legendRow.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text(group[0].length > 25 ? group[0].slice(0, 25) + "..." : group[0]);
    });
});

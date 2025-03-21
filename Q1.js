d3.csv("data_new.csv").then(function(data) {
    // Xử lý dữ liệu
    let processedData = d3.rollup(data, 
        v => d3.sum(v, d => d["Thành tiền"]),
        d => "[" + d["Mã mặt hàng"] + "] " + d["Tên mặt hàng"],
        d => "[" + d["Mã nhóm hàng"] + "] " + d["Tên nhóm hàng"]
    );
    
    let flatData = [];
    processedData.forEach((groups, product) => {
        groups.forEach((value, group) => {
            flatData.push({ product, group, value });
        });
    });

    // Sắp xếp dữ liệu theo doanh số từ lớn đến bé
    flatData.sort((a, b) => b.value - a.value);

    let margin = { top: 50, right: 250, bottom: 50, left: 250 },
    width = 1400 - margin.left - margin.right,  // Tăng chiều rộng lên 1400px
    height = 700 - margin.top - margin.bottom;  // Giữ nguyên chiều cao



    let svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    let x = d3.scaleLinear()
        .domain([0, d3.max(flatData, d => d.value) / 1e6])
        .range([0, width * 0.8]);

    let y = d3.scaleBand()
        .domain(flatData.map(d => d.product))
        .range([0, height])
        .padding(0.2);

    let color = d3.scaleOrdinal(d3.schemeCategory10);

    // Vẽ thanh bar
    svg.selectAll("rect")
        .data(flatData)
        .enter().append("rect")
        .attr("x", 0)
        .attr("y", d => y(d.product))
        .attr("width", d => x(d.value / 1e6))
        .attr("height", y.bandwidth())
        .attr("fill", d => color(d.group));

    svg.selectAll("text.value")
        .data(flatData)
        .enter().append("text")
        .attr("class", "value")
        .attr("x", d => x(d.value / 1e6) + 10)
        .attr("y", d => y(d.product) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        // Hiển thị "626 triệu VND" thay vì "626M"
        .text(d => Math.round(d.value / 1e6) + " triệu VND")
        .style("font-size", "14px")
        .style("fill", "#333");
    
    

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d => d + "M"));

    svg.append("g")
        .call(d3.axisLeft(y).tickSize(0).tickPadding(10));

    // Thêm legend (chú thích nhóm hàng)
    let legend = svg.append("g")
        .attr("transform", `translate(${width + 50}, 0)`);  // Đẩy legend ra xa hơn
    
    let groups = [...new Set(flatData.map(d => d.group))];
    
    legend.selectAll("rect")
        .data(groups)
        .enter().append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 25)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", d => color(d));
    
    legend.selectAll("text")
        .data(groups)
        .enter().append("text")
        .attr("x", 20)
        .attr("y", (d, i) => i * 25 + 12)
        .text(d => d)
        .style("font-size", "14px");
});

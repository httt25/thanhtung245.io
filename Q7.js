d3.csv("data_new.csv").then(function(data) {
    console.log(data);

    let total_orders = new Set(data.map(d => d['Mã đơn hàng'])).size;

    let groupedData = d3.rollup(data, v => new Set(v.map(d => d['Mã đơn hàng'])).size, d => d['Mã nhóm hàng']);
    let probability = Array.from(groupedData, ([key, value]) => ({
        'Mã nhóm hàng': key,
        'Số lượng hóa đơn': value,
        'Xác suất (%)': (value / total_orders) * 100
    }));

    let groupNames = Array.from(new Set(data.map(d => d['Mã nhóm hàng'])))
        .map(key => {
            let group = data.find(d => d['Mã nhóm hàng'] === key);
            return { 'Mã nhóm hàng': key, 'Tên nhóm hàng': group ? group['Tên nhóm hàng'] : 'Không xác định' };
        });

    probability.forEach(p => {
        let group = groupNames.find(g => g['Mã nhóm hàng'] === p['Mã nhóm hàng']);
        p['Nhóm hàng'] = group ? `[${p['Mã nhóm hàng']}] ${group['Tên nhóm hàng']}` : `[${p['Mã nhóm hàng']}]`;
    });

    // **Sắp xếp giảm dần theo xác suất**
    probability.sort((a, b) => b['Xác suất (%)'] - a['Xác suất (%)']);

    let margin = { top: 20, right: 50, bottom: 40, left: 150 },
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    let svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    let maxProbability = d3.max(probability, d => d['Xác suất (%)']) || 0;
    let x = d3.scaleLinear()
        .domain([0, maxProbability])
        .range([0, width]);

    let y = d3.scaleBand()
        .domain(probability.map(d => d['Nhóm hàng']))
        .range([0, height])
        .padding(0.1);

    let colorScale = d3.scaleOrdinal(d3.schemeTableau10)
        .domain(probability.map(d => d['Nhóm hàng']));

    svg.selectAll(".bar")
        .data(probability)
      .enter().append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", d => y(d['Nhóm hàng']))
        .attr("width", d => x(d['Xác suất (%)']))
        .attr("height", y.bandwidth())
        .attr("fill", d => colorScale(d['Nhóm hàng']));

    // **Thêm nhãn giá trị bên ngoài thanh**
    svg.selectAll(".text")
        .data(probability)
      .enter().append("text")
        .attr("class", "text")
        .attr("x", d => x(d['Xác suất (%)']) + 5)  // Dịch ra ngoài thanh
        .attr("y", d => y(d['Nhóm hàng']) + y.bandwidth() / 2)
        .attr("dy", ".35em")
        .attr("text-anchor", "start")  // Căn trái
        .text(d => `${d['Xác suất (%)'].toFixed(1)}%`);

    // **Thêm trục X có ký hiệu phần trăm**
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(5).tickFormat(d => d + "%"));

    // **Thêm trục Y với format mới**
    svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y));

}).catch(function(error) {
    console.log("Error loading the CSV file:", error);
});

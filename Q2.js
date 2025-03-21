// script.js
// =========================
d3.csv("data_new.csv").then(function(rawData) {
  let grouped = d3.rollups(
    rawData,
    v => d3.sum(v, d => d["Thành tiền"]),
    d => d["Mã nhóm hàng"],
    d => d["Tên nhóm hàng"]
  );

  let data = [];
  for (let [maNhom, arr] of grouped) {
    for (let [tenNhom, sumThanhTien] of arr) {
      let million = sumThanhTien / 1e6;
      data.push({
        maNhomHang: maNhom,
        tenNhomHang: tenNhom,
        doanhSo: million
      });
    }
  }
  data.sort((a, b) => b.doanhSo - a.doanhSo);

  createBarChart(data);
}).catch(function(error) {
  console.error("Lỗi khi đọc JSON:", error);
});

function createBarChart(data) {
  var margin = { top: 30, right: 500, bottom: 50, left: 150 },
      width  = 2000 - margin.left - margin.right,
      height = 600  - margin.top  - margin.bottom;

  var svg = d3.select("#chart")
              .append("svg")
              .attr("width",  width  + margin.left + margin.right)
              .attr("height", height + margin.top  + margin.bottom)
              .append("g")
              .attr("transform", `translate(${margin.left},${margin.top})`);

  var maxVal = d3.max(data, d => d.doanhSo);
  var domainMax = Math.ceil(maxVal / 100) * 100;

  var x = d3.scaleLinear()
            .domain([0, domainMax])
            .range([0, width]);

  var y = d3.scaleBand()
            .domain(data.map(d => `[${d.maNhomHang}] ${d.tenNhomHang}`))
            .range([0, height])
            .padding(0.2);

  // Dùng mảng màu cố định thay vì d3.schemeSet2
  var color = d3.scaleOrdinal()
                .domain(data.map(d => d.maNhomHang))
                .range(["#E74C3C", "#27AE60", "#F39C12", "#1ABC9C", "#2980B9"]);

  // Vẽ bar
  svg.selectAll(".bar")
     .data(data)
     .enter()
     .append("rect")
     .attr("class", "bar")
     .attr("y", d => y(`[${d.maNhomHang}] ${d.tenNhomHang}`))
     .attr("x", 0)
     .attr("width", d => x(d.doanhSo))
     .attr("height", y.bandwidth())
     .attr("fill", d => color(d.maNhomHang));

  // Vẽ nhãn bên ngoài
  svg.selectAll(".bar-label")
     .data(data)
     .enter()
     .append("text")
     .attr("class", "bar-label")
     .style("fill", "#000")
     .attr("x", d => x(d.doanhSo) + 10)
     .attr("y", d => y(`[${d.maNhomHang}] ${d.tenNhomHang}`) + y.bandwidth()/2)
     .attr("dy", "0.35em")
     .style("text-anchor", "start")
     .text(d => formatValue(d.doanhSo));

  // Trục X
  let tickValues = d3.range(0, domainMax + 1, 100);
  let xAxis = d3.axisBottom(x)
                .tickValues(tickValues)
                .tickFormat(d => d + "M");
  svg.append("g")
     .attr("class", "axis x-axis")
     .attr("transform", `translate(0,${height})`)
     .call(xAxis);

  // Trục Y
  let yAxis = d3.axisLeft(y);
  svg.append("g")
     .attr("class", "axis y-axis")
     .call(yAxis);
}

function formatValue(million) {
  let mil = Math.round(million);
  return mil.toLocaleString("vi-VN") + " triệu VND";
}

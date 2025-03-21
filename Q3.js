// script.js - Code tối ưu

d3.csv("data_new.csv").then(function(rawData) {
  var parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");

  // Gom nhóm doanh số theo tháng
  let monthlySales = rawData.reduce((acc, d) => {
      let month = parseTime(d["Thời gian tạo đơn"]).getMonth() + 1;
      acc[month] = (acc[month] || 0) + (+d["Thành tiền"]);
      return acc;
  }, {});

  // Chuyển đổi thành mảng { month, doanhSo }
  let data = Object.entries(monthlySales)
      .map(([month, sum]) => ({ month: +month, doanhSo: sum / 1e6, monthLabel: `Tháng ${String(month).padStart(2, "0")}` }))
      .sort((a, b) => a.month - b.month);

  createBarChart(data);
}).catch(error => console.error("Lỗi khi đọc JSON:", error));

// Hàm vẽ biểu đồ cột
function createBarChart(data) {
  var margin = { top: 30, right: 50, bottom: 70, left: 80 },
      width  = 900 - margin.left - margin.right,
      height = 600 - margin.top - margin.bottom;

  var svg = d3.select("#chart").append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", `translate(${margin.left},${margin.top})`);

  var maxVal = d3.max(data, d => d.doanhSo);
  var y = d3.scaleLinear().domain([0, maxVal]).nice().range([height, 0]);
  var x = d3.scaleBand().domain(data.map(d => d.monthLabel)).range([0, width]).padding(0.2);
  var color = d3.scaleSequential(d3.interpolateBlues).domain([1, 12]);

  // Vẽ cột
  svg.selectAll(".bar")
     .data(data)
     .enter().append("rect")
     .attr("class", "bar")
     .attr("x", d => x(d.monthLabel))
     .attr("y", d => y(d.doanhSo))
     .attr("width", x.bandwidth())
     .attr("height", d => height - y(d.doanhSo))
     .attr("fill", d => color(d.month));

  // Nhãn giá trị trên đỉnh cột
  svg.selectAll(".bar-label")
     .data(data)
     .enter().append("text")
     .attr("class", "bar-label")
     .attr("x", d => x(d.monthLabel) + x.bandwidth() / 2)
     .attr("y", d => y(d.doanhSo) - 10)
     .attr("text-anchor", "middle")
     .text(d => formatValue(d.doanhSo));

  // Trục X
  svg.append("g")
     .attr("class", "axis x-axis")
     .attr("transform", `translate(0,${height})`)
     .call(d3.axisBottom(x))
     .selectAll("text")
     .style("text-anchor", "end")
     .attr("dx", "-0.8em")
     .attr("dy", "0.15em")
     .attr("transform", "rotate(-45)");

  // Trục Y
  svg.append("g")
     .attr("class", "axis y-axis")
     .call(d3.axisLeft(y).ticks(6).tickFormat(d => d + "M"));
}

function formatValue(million) {
  return Math.round(million).toLocaleString("vi-VN") + " triệu VND";
}
// https://github.com/d3/d3/blob/master/API.md
// https://threejs.org/docs/#manual/en/introduction/creating-a-scene

const width = 1300,
      height = 700,
      camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000),
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
      }),
      controls = new THREE.OrbitControls(camera, renderer.domElement),
      maturityKeys = ['1-month', '3-month', '6-month', '1-year', '2-year', '3-year', '5-year', '7-year', '10-year', '20-year', '30-year'].map(s => `Market yield on U.S. Treasury securities at ${s}  constant maturity, quoted on investment basis`),
      maturityLabels = ['30Y', '20Y', '10Y', '7Y', '5Y', '3Y', '2Y', '1Y', '6M', '3M', '1M'],
      chartDims = {
        w: 80,
        h: 40,
        d: 30
      },
      axisLineMaterial = new THREE.LineBasicMaterial({ color: 'black' }),
      gridLineMaterial = new THREE.LineBasicMaterial({ color: 0xDDDDDD });

window.camera = camera; // TODO DEBUG
window.controls = controls; // TODO DEBUG

let scene = new THREE.Scene();

const addLabel = (msg, x, y, z) => {
  const sprite = new THREE.TextSprite({
    text: '' + msg,
    fontFamily: 'Helvetica, Arial, sans-serif',
    fontSize: 1
  });
  sprite.position.set(x, y, z);
  sprite.fillStyle = "rgba(0, 0, 0, 1.0)";
  scene.add(sprite);
};

const addTimeXAxis = (scales) => {
  const geometry = new THREE.Geometry(),
        zLo = scales.z.range()[1],
        yLo = scales.y.range()[0];
  geometry.vertices.push(
    new THREE.Vector3(scales.x.range()[0], yLo - 0.1, zLo - 0.1),
    new THREE.Vector3(scales.x.range()[1], yLo - 0.1, zLo - 0.1)
  );
  scene.add(new THREE.Line(geometry, axisLineMaterial));
};

const addMaturityZAxis = (scales) => {
  const geometry = new THREE.Geometry(),
        yLo = scales.y.range()[0],
        xHi = scales.x.range()[1];
  geometry.vertices.push(
    new THREE.Vector3(xHi, yLo, scales.z.range()[0]),
    new THREE.Vector3(xHi, yLo, scales.z.range()[1])
  );
  scene.add(new THREE.Line(geometry, axisLineMaterial));
};

const addInterestRateYAxis = (scales) => {
  const geometry = new THREE.Geometry(),
        xHi = scales.x.range()[1],
        zLo = scales.z.range()[0];
  geometry.vertices.push(
    new THREE.Vector3(xHi, scales.y.range()[0], zLo),
    new THREE.Vector3(xHi, scales.y.range()[1], zLo)
  );
  scene.add(new THREE.Line(geometry, axisLineMaterial));
};

const addTimeXGrid = (scales) => {
  const yLo = scales.y.range()[0];
  const ticks = scales.x.ticks(10);
  let tickFormat = (v) => v.getFullYear();
  if (ticks.length != (new Set(ticks.map(v => v.getFullYear()))).size) {
    tickFormat = (v) => v.getFullYear() + '/' + (v.getMonth()+1).toString().padStart(2, '0');
  }
  ticks.forEach((v) => {
    const geometry = new THREE.Geometry(),
          xTick = scales.x(v);
    geometry.vertices.push(
      new THREE.Vector3(xTick, yLo, scales.z.range()[0]),
      new THREE.Vector3(xTick, yLo, scales.z.range()[1])
    );
    scene.add(new THREE.Line(geometry, gridLineMaterial));
    addLabel(tickFormat(v), xTick, yLo - 1, scales.z.range()[1] + 2);
  });
  addLabel('Date', d3.mean(scales.x.range()), yLo - 3, scales.z.range()[1] + 4);
};

const addMaturityZGrid = (scales) => {
  const yLo = scales.y.range()[0];
  scales.z.ticks(11).forEach((v) => {
    const geometry = new THREE.Geometry(),
          zTick = scales.z(v);
    geometry.vertices.push(
      new THREE.Vector3(scales.x.range()[0], yLo, zTick),
      new THREE.Vector3(scales.x.range()[1], yLo, zTick)
    );
    scene.add(new THREE.Line(geometry, gridLineMaterial));
    if (maturityLabels[v]) {
      addLabel(maturityLabels[v], scales.x.range()[1] + 2, yLo - 1, zTick);
    }
  });
  addLabel('Maturity', scales.x.range()[1] + 6, yLo - 1, d3.mean(scales.z.range()));
};

const addInterestRateYGrid = (scales) => {
  const zLo = scales.z.range()[0];
  scales.y.ticks(20).forEach((v, i) => {
    const geometry = new THREE.Geometry(),
          yTick = scales.y(v);
    geometry.vertices.push(
      new THREE.Vector3(scales.x.range()[0], yTick, zLo),
      new THREE.Vector3(scales.x.range()[1], yTick, zLo)
    );
    scene.add(new THREE.Line(geometry, gridLineMaterial));
    if (v !== 0) {
      addLabel(v + '%', scales.x.range()[1] + 2, yTick, zLo - 1);
    }
  });
  addLabel('Interest Rate', scales.x.range()[1] + 7, d3.mean(scales.y.range()), zLo - 1);
};

const addSurface = (data, scales) => {
  // planegeometry is created on XY plane for days/maturities,
  // then moved to XZ plane and height Y is raised to interest rate.
  const geometry = new THREE.PlaneGeometry(chartDims.w,
                                           chartDims.d - 1,
                                           data.length - 1,
                                           maturityKeys.length - 1),
        material = new THREE.MeshBasicMaterial({
          side: THREE.DoubleSide,
          vertexColors: THREE.VertexColors
        }),
        faceColors = [];
  geometry.vertices.forEach((vertex, i) => {
    const dayNum = i % data.length,
          matNum = Math.floor(i / data.length),
          interestRate = data[dayNum].curve[matNum];
    faceColors.push(scales.color(interestRate));
    vertex.z = vertex.y;
    vertex.y = scales.y(interestRate);
  });
  window.faceColors = faceColors; // TODO debug
  window.surface = geometry; // TODO debug
  geometry.faces.forEach((face) => {
    face.vertexColors[0] = new THREE.Color(faceColors[face.a]);
    face.vertexColors[1] = new THREE.Color(faceColors[face.b]);
    face.vertexColors[2] = new THREE.Color(faceColors[face.c]);
  });
  scene.add(new THREE.Mesh(geometry, material));
};

// maturity surface lines (fixed maturity z, varying x and y)
const addMaturitySurfaceLines = (data, scales) => {
  maturityKeys.forEach((k, i) => {
    let geometry = new THREE.Geometry();
    data.forEach((datum) => {
      if (!isNaN(datum.curve[i])) {
        geometry.vertices.push(
          new THREE.Vector3(
            scales.x(datum.date),
            scales.y(datum.curve[i]),
            scales.z(maturityKeys.length - i - 1)));
      }
    });
    scene.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 'white' })));
  });
};

const processRow = (row) => {
  return {
    date: new Date(row['Series Description']),
    curve: maturityKeys.map(k => (row[k] == '') ? Number.NaN : +row[k])
  };
};

const handleData = (data) => {
  const scales = {
    x: d3.scaleTime()
      .domain([data[0].date, data[data.length - 1].date])
      .range([-0.5 * chartDims.w, 0.5 * chartDims.w]),
    y: d3.scaleLinear()
      .domain([0, d3.max(data.flatMap(d => d.curve))])
      .range([0, chartDims.h]),
    z: d3.scaleLinear()
      .domain([-0.25, maturityKeys.length - 0.75])
      .range([-0.5 * chartDims.d, 0.5 * chartDims.d]),
    color: d3.scaleQuantile()
      .domain(data.flatMap(d => d.curve))
      .range(['#eef4f8','#ddecf4','#cce5f0','#bcddec','#aed5e7','#a0cde2',
              '#94c5dc','#89bcd6','#7eb4d0','#74abc9','#6aa2c2','#619abb',
              '#5892b4','#4f8aad','#4781a6','#3f799f','#3a7195','#35688c',
              '#326082','#2f5877','#2c506c','#243d52'])
  };
  window.scales = scales; // TODO debug
  addTimeXAxis(scales);
  addMaturityZAxis(scales);
  addInterestRateYAxis(scales);
  addTimeXGrid(scales);
  addMaturityZGrid(scales);
  addInterestRateYGrid(scales);
  addSurface(data, scales);
  addMaturitySurfaceLines(data, scales);
};

const consumeData = (fullData) => {
  fullData.splice(0, 5); // first 5 rows have no data
  fullData = fullData.filter(row => row.curve.some(v => !isNaN(v)));
  document.getElementById('start').value = fullData[0].date.toISOString().slice(0,10);
  document.getElementById('end').value = fullData[fullData.length-1].date.toISOString().slice(0,10);
  window.fullData = fullData; // for date range selection
  handleData(fullData);
};

d3.csv('frb.csv', processRow).then(consumeData);

renderer.setSize(width, height);
renderer.setClearColor('white', 0);
document.getElementById('3d').appendChild(renderer.domElement);

camera.position.set(40, 10, 50);
camera.lookAt(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.2;
controls.target.set(4, 10, -8);
controls.enableZoom = false;
controls.update();

(function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
})();


const submitDateRange = () => {
  let start = new Date(document.getElementById('start').value),
      end = new Date(document.getElementById('end').value),
      data = window.fullData.filter(x => start <= x.date && x.date <= end);
  scene = new THREE.Scene();
  handleData(data);
  return false;
};

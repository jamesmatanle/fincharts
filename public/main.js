// https://github.com/d3/d3/blob/master/API.md
// https://threejs.org/docs/#manual/en/introduction/creating-a-scene

const width = 1300,
      height = 700,
      scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000),
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
      }),
      controls = new THREE.OrbitControls(camera, renderer.domElement);

renderer.setSize(width, height);
renderer.setClearColor('white', 0);
document.body.appendChild(renderer.domElement);

camera.position.set(40, 10, 50);
camera.lookAt(0, 0, 0);

controls.damping = 0.2;
controls.target.set(4, 10, -8);
controls.enableZoom = false;
controls.update();

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();

const maturity_keys = [
  'Market yield on U.S. Treasury securities at 1-month   constant maturity, quoted on investment basis',
  'Market yield on U.S. Treasury securities at 3-month   constant maturity, quoted on investment basis',
  'Market yield on U.S. Treasury securities at 6-month   constant maturity, quoted on investment basis',
  'Market yield on U.S. Treasury securities at 1-year   constant maturity, quoted on investment basis',
  'Market yield on U.S. Treasury securities at 2-year   constant maturity, quoted on investment basis',
  'Market yield on U.S. Treasury securities at 3-year   constant maturity, quoted on investment basis',
  'Market yield on U.S. Treasury securities at 5-year   constant maturity, quoted on investment basis',
  'Market yield on U.S. Treasury securities at 7-year   constant maturity, quoted on investment basis',
  'Market yield on U.S. Treasury securities at 10-year   constant maturity, quoted on investment basis',
  'Market yield on U.S. Treasury securities at 20-year   constant maturity, quoted on investment basis',
  'Market yield on U.S. Treasury securities at 30-year   constant maturity, quoted on investment basis'
],
      maturity_labels = ['30Y', '20Y', '10Y', '7Y', '5Y', '3Y', '2Y', '1Y', '6M', '3M', '1M'],
      allInterestRateValues = [];

let maxInterestRateValue = 0;

d3.csv('frb.csv', (r) => {
  return {
    date: new Date(r['Series Description']),
    curve: maturity_keys.map((k) => {
      if (r[k] == '') r[k] = Number.NaN;
      if (+r[k] > maxInterestRateValue) maxInterestRateValue = +r[k];
      allInterestRateValues.push(+r[k]);
      return +r[k];
    })
  };
}).then((data) => {
  data = data.slice(5); // first 5 rows have no data
  const chartDims = {
    w: 80,
    h: 40,
    d: 30
  },
        axisLineMaterial = new THREE.LineBasicMaterial({ color: 'black' }),
        gridLineMaterial = new THREE.LineBasicMaterial({ color: 0xDDDDDD }),
        xScale = d3.scaleTime()
        .domain([data[0].date, data[data.length - 1].date])
        .range([-0.5 * chartDims.w, 0.5 * chartDims.w]),
        yScale = d3.scaleLinear()
        .domain([0, maxInterestRateValue])
        .range([0, chartDims.h]),
        zScale = d3.scaleLinear()
        .domain([-0.25, maturity_keys.length - 0.75])
        .range([-0.5 * chartDims.d, 0.5 * chartDims.d]),
        colorScale = d3.scaleLinear()
        .domain([0, maxInterestRateValue])
        .range(['honeydew', 'darkgreen']);

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

  // time x axis
  {
    const geometry = new THREE.Geometry(),
          zLo = zScale.range()[1],
          yLo = yScale.range()[0];
    geometry.vertices.push(
      new THREE.Vector3(xScale.range()[0], yLo - 0.1, zLo - 0.1),
      new THREE.Vector3(xScale.range()[1], yLo - 0.1, zLo - 0.1)
    );
    scene.add(new THREE.Line(geometry, axisLineMaterial));
  }

  // maturity z axis
  {
    const geometry = new THREE.Geometry(),
          yLo = yScale.range()[0],
          xHi = xScale.range()[1];
    geometry.vertices.push(
      new THREE.Vector3(xHi, yLo, zScale.range()[0]),
      new THREE.Vector3(xHi, yLo, zScale.range()[1])
    );
    scene.add(new THREE.Line(geometry, axisLineMaterial));
  }

  // interest rate y axis
  {
    const geometry = new THREE.Geometry(),
          xHi = xScale.range()[1],
          zLo = zScale.range()[0];
    geometry.vertices.push(
      new THREE.Vector3(xHi, yScale.range()[0], zLo),
      new THREE.Vector3(xHi, yScale.range()[1], zLo)
    );
    scene.add(new THREE.Line(geometry, axisLineMaterial));
  }

  // time x grid
  {
    const yLo = yScale.range()[0];
    xScale.ticks(20).forEach((v) => {
      const geometry = new THREE.Geometry(),
            xTick = xScale(v);
      geometry.vertices.push(
        new THREE.Vector3(xTick, yLo, zScale.range()[0]),
        new THREE.Vector3(xTick, yLo, zScale.range()[1])
      );
      scene.add(new THREE.Line(geometry, gridLineMaterial));
      addLabel(v.getFullYear(), xTick, yLo - 1, zScale.range()[1] + 2);
    });
  }

  // maturity z grid
  {
    const yLo = yScale.range()[0];
    zScale.ticks(11).forEach((v) => {
      const geometry = new THREE.Geometry(),
            zTick = zScale(v);
      geometry.vertices.push(
        new THREE.Vector3(xScale.range()[0], yLo, zTick),
        new THREE.Vector3(xScale.range()[1], yLo, zTick)
      );
      scene.add(new THREE.Line(geometry, gridLineMaterial));
      if (maturity_labels[v]) {
        addLabel(maturity_labels[v], xScale.range()[1] + 2, yLo - 1, zTick);
      }
    });
  }

  // interest rate y grid
  {
    const zLo = zScale.range()[0];
    yScale.ticks(20).forEach((v, i) => {
      const geometry = new THREE.Geometry(),
            yTick = yScale(v);
      geometry.vertices.push(
        new THREE.Vector3(xScale.range()[0], yTick, zLo),
        new THREE.Vector3(xScale.range()[1], yTick, zLo)
      );
      scene.add(new THREE.Line(geometry, gridLineMaterial));
      if (v !== 0) {
        addLabel(v + '%', xScale.range()[1] + 2, yTick, zLo - 1);
      }
    });
  }

  // interest rate surface
  {
    // planegeometry is created on XY plane for days/maturities,
    // then moved to XZ plane and height Y is raised to interest rate.
    const geometry = new THREE.PlaneGeometry(chartDims.w,
                                             chartDims.d - 1,
                                             data.length - 1,
                                             maturity_keys.length - 1),
          material = new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            vertexColors: THREE.VertexColors
          }),
          faceColors = [];

    geometry.vertices.forEach((vertex, i) => {
      const dayNum = i % data.length,
            matNum = Math.floor(i / data.length),
            interestRate = yScale(data[dayNum].curve[matNum]);
      faceColors.push(colorScale(interestRate));
      vertex.z = vertex.y;
      vertex.y = interestRate;
    });

    geometry.faces.forEach((face) => {
      face.vertexColors[0] = new THREE.Color(faceColors[face.a]);
      face.vertexColors[1] = new THREE.Color(faceColors[face.b]);
      face.vertexColors[2] = new THREE.Color(faceColors[face.c]);
    });
    scene.add(new THREE.Mesh(geometry, material));
  }

  // maturity surface lines (fixed maturity z, varying x and y)
  {
    maturity_keys.forEach((k, i) => {
      let geometry = new THREE.Geometry();
      data.forEach((datum) => {
        if (!isNaN(datum.curve[i])) {
          geometry.vertices.push(
            new THREE.Vector3(
              xScale(datum.date),
              yScale(datum.curve[i]),
              zScale(maturity_keys.length - i - 1)));
        }
      });
      scene.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 'white' })));
    });
  }
});

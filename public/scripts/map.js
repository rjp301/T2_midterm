//first initialize the map as a global valuable//
let map;
let allPins = [];
let infowindowIsOpen = false;

//get mapid from route/
const pathname = window.location.pathname;
const mapId = pathname.split("/")[2];

$(document).ready(() => {
  fetchMap();
  selectPinOnMap();

  // edit button on click, title/desc html becomes editable, edit becomes save button
  $("#floating-menu").on("click", ".inner-editmap-btn", function () {

    const $editButton = $(this);
    const $mapTitle = $("#list-of-locations > h2");
    const $mapDesc = $("#list-of-locations > p");
    // console.log($mapTitle.text(), $mapDesc.text())

        //toggle between "edit" and "save changes" when clicking edit button
    $editButton.toggleClass("edit-active");
    if ($editButton.hasClass("edit-active")) {
      $editButton.text("Save Changes");
      $mapTitle.attr("contenteditable", "true");
      $mapTitle.css("background-color", "yellow");
      $mapDesc.attr("contenteditable", "true");
      $mapDesc.css("background-color", "yellow");
    } else {
      $editButton.text("Edit");
      $mapTitle.attr("contenteditable", "false");
      $mapTitle.css("background-color", "inherit");
      $mapDesc.attr("contenteditable", "false");
      $mapDesc.css("background-color", "inherit");
    }
  // save button on click
  //$.ajax( type: post, url: /maps/:mapid, data: mapid, body )
  if ($editButton.text() === "Edit") {
    const mapData = {
      name: $mapTitle.text(),
      description: $mapDesc.text(),
    }
    console.log("sending...", mapData)
    $.ajax({
      url: `/maps/${mapId}`,
      method: "POST",
      data: mapData,
    })
  }
  // then toggle back to edit button, editable = false.


  })


});

// show pin position on map when selected from side menu
const selectPinOnMap = () => {
  $('#floating-menu').on('mouseover', 'li', function () {
    const $listOfPins = $('ul').children();
    for (let i = 0; i < $listOfPins.length; i++) {
      $($listOfPins[i]).on("click", () => {
        showSelectedPinOnMap(i);
        // work in progress -- OPTION TO HIGHLIGHT THE SELECTED TEXT WHEN PIN IS ACTIVE
        // if ($($listOfPins[i]).hasClass("green")) {
        //   $($listOfPins[i]).removeClass("green");
        // } else {
        //   $($listOfPins[i]).addClass("green");
        // }
      })
    }
  })
}

// const editMapInfo = () => {
//     const $menu = $('#floating-menu');

//       console.log($($menu).children())

//     // $menu.on("click", "h2", () => {

//     // })

// }

// bounce and show selected pin on map
const showSelectedPinOnMap = function(index) {
  //show pin data card
  google.maps.event.trigger(allPins[index], 'click');

  //bounce pin
  allPins[index].setAnimation(google.maps.Animation.BOUNCE);
  setTimeout(() => {
    allPins[index].setAnimation(null);
  }, 350);
};

// refresh sidebar with newest pin added
const reloadSidebar = () => {
  $(".pin-list").empty();
  allPins = [];
  fetchPins(mapId);
};

//Load fullsize google map//
const loadMap = (mapData) => {
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: { lat: mapData.avg_lat, lng: mapData.avg_lng },
    streetViewControl: false,
    fullscreenControl: false,
    mapTypeControl: false,
  });

  // Listen for any clicks on the map
  map.addListener("click", onMapClick);
};

// Add a new marker when clicking map
const onMapClick = (event) => {
  const coordinates = event.latLng;
  addNewPin(coordinates);
};

// Add a new marker to map
const addNewPin = (position) => {
  const newPin = new google.maps.Marker({
    position,
    map,
  });

  const pinData = {
    map_id: mapId,
    title: "Untitled pin",
    description: "Enter description",
    image_url: "Image URL",
    latitude: newPin.getPosition().lat(),
    longitude: newPin.getPosition().lng(),
  };

  // New marker is automatically added to database
  $.ajax({
    url: "/pins/new",
    method: "POST",
    data: pinData,
  })
    .then(() => {
      reloadSidebar();
    })
    .catch((err) => console.log("OOPSIE DOOPSIE", err.message));
};

//create map pins//
const mapPins = (pin) => {
  const marker = new google.maps.Marker({
    position: { lat: pin.lat, lng: pin.lng },
    map: map,
    draggable: true
  });
  allPins.unshift(marker);

  //shows infowindow when click map pin//
  marker.addListener("click", () => {
    const infoWindow = mapInfo(pin);

    infowindow.open({
      anchor: marker,
      map,
      });
    //   infowindowIsOpen = true;
    // }
  });
};

//create map info//
const mapInfo = (pin) => {
  return (infowindow = new google.maps.InfoWindow({
    content: generateInfoContent(pin),
  }));
};

//Initial infowindow HTML skeleton//
const generateInfoContent = (pin) => {
  const content = `
  <div class='info-window'>
     <h3>${pin.title}</h3>
     <img src='${pin.image_url}'>
     <p>${pin.description}</p>
     <div class='info-buttons'>
       <img onClick="deletePin(${pin.id})" class='pin-trash' src='../docs/icons8-waste-50.png'>
       <div >
        <img onClick='editPin("${pin.id}, ${pin.title}, ${pin.image_url}, ${pin.description}")' class='pin-edit' src='../docs/icons8-pencil-50.png'>
       </div>
     </div>
  </div>
  `;
  return content;
};

//Edit pin when click the pen icon

const editPin = (pinId, pinTitle, pinImg, pinDesc) => {
  console.log("coming from edit pin ", pinId, pinTitle, pinImg, pinDesc);
  const editContent = `
  <form >
     <label>Title</label>
     <input type="text" value="${pinTitle}">
     <label>Description</label>
     <input type="text" value="${pinDesc}">
     <label>Image URL</label>
     <input type="text" value="${pinImg}">
    <button onClick="editSubmit(${pinId})">Edit</button>
  </form>`;

  $(".info-window").empty().append(editContent);
};

const editSubmit = (pinId) => {
  const pinData = {};
  $.post(`/pins/${pinId}`, pinId, pinData)
    .then(() => {
      console.log(`Success to Edit pin`);
    })
    .catch((err) => {
      console.log(`Edit pin Error :`, err.message);
    });
};

//create HTML skeleton//
const createMapElement = (map) => {
  const mapName = map.name;
  const mapDesc = map.description;
  const $map = `
    <section id="list-of-locations">
      <a id="back-to-maps" href="/">Back to maps</a>
      <h2>${mapName}</h2>
      <p>${mapDesc}</p>
      <ul class='pin-list'>
      </ul>
    </section>
    <div id="map-buttons">
      <button class="inner-editmap-btn">Edit</button>
      <button class="inner-fav-btn">Fav</button>
      <button class="inner-share-btn">Share</button>
    </div>
 `;
  return $map;
};

const renderPins = (pins) => {
  for (const pin of pins) {
    mapPins(pin);
    $(".pin-list").prepend(`<li>${pin.title}</li>`);
  }
};

const fetchMap = () => {
  $.get(`/maps/api/${mapId}`).then((map) => renderMap(map));
};

const fetchPins = (mapId) => {
  $.get(`/pins/bymap/${mapId}`).then((pins) => {
    renderPins(pins);
  });
};

const renderMap = function (map) {
  loadMap(map);
  fetchPins(map.id);

  $("#floating-menu").empty();
  const $map = createMapElement(map);
  $("#floating-menu").append($map);
};

//delete pin when click the trash icon//
const deletePin = (pinId) => {
  $.get(`/pins/${pinId}/delete`).then(() => {
    alert("pin is deleted");
  });
  fetchMap();
};

//
//
// future/stretch ideas //
  //could add optional drag function //
  //in routes/queries, add || to determine which fields get updated and which stay the same value
  // google.maps.event.addListener(marker, 'dragend', function (evt) {
  //   const pinNewPosition = evt.latLng;
  //   $.ajax({
  //     url: "/pins/:id",
  //     method: 'POST',
  //     data: pinNewPosition
  //   });
  //   // map.panTo(evt.latLng);
  // })

  // click pin to toggle infowindow
      // if (infowindowIsOpen) {
    //   infowindow.close();
    //   infowindowIsOpen = false;
    // } else if (!infowindowIsOpen) {


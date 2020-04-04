/* copied and modified from draco js example */

import DracoMeshWebDecoder from './draco-build/draco_decoder';
import wasm_str from './tmp/import-wasm'
const wasmBinary = Uint8Array.from(atob(wasm_str), c => c.charCodeAt(0)).buffer;
const attributeIDs = {
    position: 'POSITION',
    normal: 'NORMAL',
    color: 'COLOR',
    uv: 'TEX_COORD'
};
const attributeTypes = {
    position: 'Float32Array',
    normal: 'Float32Array',
    color: 'Uint8Array',
    uv: 'Float32Array'
};

function decodeAttribute(decoder, mesh, name, attributeType, attribute) {

    const itemSize = attribute.num_components();
    const length = mesh.num_points() * itemSize;
    let size, array, ptr;

    switch (attributeType) {

        case 'Float32Array':
            size = length * 4;
            ptr = draco._malloc(size);
            decoder.GetAttributeDataArrayForAllPoints(mesh, attribute, draco.DT_FLOAT32, size, ptr);
            array = new Float32Array(draco.HEAPF32.buffer, ptr, length).slice();
            break;

        case 'Int8Array':
            ptr = draco._malloc(length);
            decoder.GetAttributeDataArrayForAllPoints(mesh, attribute, draco.DT_INT8, length, ptr);
            array = new Int8Array(draco.HEAP8.buffer, ptr, length).slice();
            break;

        case 'Int16Array':
            size = length * 2;
            ptr = draco._malloc(size);
            decoder.GetAttributeDataArrayForAllPoints(mesh, attribute, draco.DT_INT16, size, ptr);
            array = new Int16Array(draco.HEAP16.buffer, ptr, length).slice();
            break;

        case 'Int32Array':
            size = length * 4;
            ptr = draco._malloc(size);
            decoder.GetAttributeDataArrayForAllPoints(mesh, attribute, draco.DT_INT32, size, ptr);
            array = new Int32Array(draco.HEAP32.buffer, ptr, length).slice();
            break;

        case 'Uint8Array':
            ptr = draco._malloc(length);
            decoder.GetAttributeDataArrayForAllPoints(mesh, attribute, draco.DT_UINT8, length, ptr);
            array = new Uint8Array(draco.HEAPU8.buffer, ptr, length).slice();
            break;

        case 'Uint16Array':
            size = length * 2;
            ptr = draco._malloc(size);
            decoder.GetAttributeDataArrayForAllPoints(mesh, attribute, draco.DT_UINT16, size, ptr);
            array = new Uint16Array(draco.HEAPU16.buffer, ptr, length).slice();
            break;

        case 'Uint32Array':
            size = length * 4;
            ptr = draco._malloc(size);
            decoder.GetAttributeDataArrayForAllPoints(mesh, attribute, draco.DT_UINT32, size, ptr);
            array = new Uint32Array(draco.HEAPU32.buffer, ptr, length).slice();
            break;

        default:
            throw new Error('Unexpected attribute type.');
    }

    draco._free(ptr);

    return { name, array, itemSize };

}


function decode(drc) {

    const geometry = { index: null, attributes: [] };
    const buffer = new draco.DecoderBuffer();
    buffer.Init(new Int8Array(drc), drc.byteLength);
    const decoder = new draco.Decoder();

    if (decoder.GetEncodedGeometryType(buffer) === draco.TRIANGULAR_MESH) {

        const mesh = new draco.Mesh();
        decoder.DecodeBufferToMesh(buffer, mesh);

        const length = mesh.num_faces() * 3;
        const size = length * 4;
        const ptr = draco._malloc(size);
        decoder.GetTrianglesUInt32Array(mesh, size, ptr);
        const index = new Uint32Array(draco.HEAPU32.buffer, ptr, length).slice();
        geometry.index = { array: index, itemSize: 1 };

        draco._free(ptr);

        for (const attributeName in attributeIDs) {
            const attributeType = attributeTypes[attributeName];
            const attributeID = decoder.GetAttributeId(mesh, draco[attributeIDs[attributeName]]);
            const attribute = decoder.GetAttribute(mesh, attributeID);
            geometry.attributes.push(decodeAttribute(decoder, mesh, attributeName, attributeType, attribute));
        }

        draco.destroy(mesh);

    }

    draco.destroy(decoder);
    draco.destroy(buffer);

    return geometry;
}

let draco;
DracoMeshWebDecoder({ wasmBinary })
    .then(draco_ => {
        draco = draco_;
        self.postMessage({ initialized: true });
        self.onmessage = function (evt) {
            try {
                const drc = evt.data;
                const geometry = drc instanceof ArrayBuffer ? decode(drc) : null;
                const transfer = geometry ? [geometry.index.array.buffer, ...Object.keys(geometry.attributes).map(key => geometry.attributes[key].array.buffer)] : []
                postMessage(geometry, transfer);
            } catch (err) {
                console.log(err);
                postMessage(null);
            }
        }
    });

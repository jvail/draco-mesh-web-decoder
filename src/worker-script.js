/* copied and modified from draco js example */

import DracoMeshWebDecoder from './draco-build/draco_decoder';
import wasm_str from './tmp/import-wasm'
const wasmBinary = Uint8Array.from(atob(wasm_str), c => c.charCodeAt(0)).buffer;

const getConfig = (userConfig) => {
    const attributeIDs = {
        position: 'POSITION',
        normal: 'NORMAL',
        color: 'COLOR',
        uv: 'TEX_COORD',
        generic: 'GENERIC'
    };
    const attributeTypes = {
        position: 'Float32Array',
        normal: 'Float32Array',
        color: 'Uint8Array',
        uv: 'Float32Array',
        generic: 'Uint32Array'
    };

    return {
        attributeIDs: {
            ...attributeIDs,
            ...(userConfig['ids'] || {} )
        },
        attributeTypes: {
            ...attributeTypes,
            ...(userConfig['types'] || {})
        },
        metadataTypes: userConfig['metadata'] || []
    };

}

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

function decodeMetadata(querier, metadata, metadataTypes) {

    return metadataTypes.reduce((data, metadataType) => {
        const { name, type } = metadataType;
        if (metadata && querier.HasEntry(metadata, name)) {
            let entry, arr, length, ptr;
            try {
                switch (type) {
                    case 'int':
                        entry = querier.GetIntEntry(metadata, name);
                        break;
                    case 'double':
                        entry = querier.GetDoubleEntry(metadata, name);
                        break;
                    case 'string':
                        entry = querier.GetStringEntry(metadata, name);
                        break;
                    case 'int[]':
                        arr = new draco.DracoInt32Array();
                        querier.GetIntEntryArray(metadata, name, arr);
                        length = arr.size();
                        // ptr = arr.data().ptr;
                        // entry = new Int32Array(draco.HEAPU8.buffer.slice(ptr, ptr + length * 4));
                        entry = new Int32Array(length);
                        for (let idx = 0; idx < length; idx++) {
                            entry[idx] = arr.GetValue(idx);
                        }
                        break;
                    case 'double[]':
                        arr = new draco.DracoFloat32Array();
                        querier.GetDoubleEntryArray(metadata, name, arr);
                        length = arr.size();
                        // ptr = arr.data().ptr;
                        // entry = new Float32Array(draco.HEAPU8.buffer.slice(ptr, ptr + length * 4));
                        entry = new Float32Array(length);
                        for (let idx = 0; idx < length; idx++) {
                            entry[idx] = arr.GetValue(idx);
                        }
                        break;
                    case 'mesh':
                    case 'binary':
                        arr = new draco.DracoUInt8Array();
                        querier.GetBinaryEntry(metadata, name, arr);
                        length = arr.size();
                        ptr = arr.data().ptr;
                        entry = new Uint8Array(draco.HEAPU8.buffer.slice(ptr, ptr + length));
                        // for (let idx = 0; idx < length; idx++) {
                        //     entry[idx] = arr.GetValue(idx);
                        // }
                        if (type === 'mesh') {
                            entry = decode([entry], { metadata: metadataTypes });
                        }
                        break;
                }
            } catch (err) {
                console.log(err);
            } finally {
                data[name] = entry;
            }
        }
        return data;
    }, {});

}


function decode(drcs, configs) {

    const metadataQuerier = new draco.MetadataQuerier();

    return drcs.map((drc, i) => {

        const { attributeIDs, attributeTypes, metadataTypes } = getConfig(Array.isArray(configs) ? configs[i] : configs);
        const geometry = { index: { array: new Float32Array() }, attributes: [], metadata: {} };
        const buffer = new draco.DecoderBuffer();
        buffer.Init(new Int8Array(drc), drc.byteLength);
        const decoder = new draco.Decoder();
        const type = decoder.GetEncodedGeometryType(buffer);
        let meshOrCloud, status;

        if (type === draco.TRIANGULAR_MESH) {
            meshOrCloud = new draco.Mesh();
            status = decoder.DecodeBufferToMesh(buffer, meshOrCloud);
            const length = meshOrCloud.num_faces() * 3;
            const size = length * 4;
            const ptr = draco._malloc(size);
            decoder.GetTrianglesUInt32Array(meshOrCloud, size, ptr);
            const index = new Uint32Array(draco.HEAPU32.buffer, ptr, length).slice();
            geometry.index = { array: index, itemSize: 1 };
            draco._free(ptr);
        } else if (type === draco.POINT_CLOUD) {
            meshOrCloud = new draco.PointCloud();
            status = decoder.DecodeBufferToPointCloud(buffer, meshOrCloud);
        }

        if (status && status.ok()) {
            for (const attributeName in attributeIDs) {
                const attributeType = attributeTypes[attributeName];
                const attributeID = decoder.GetAttributeId(meshOrCloud, draco[attributeIDs[attributeName]]);
                const attribute = decoder.GetAttribute(meshOrCloud, attributeID);
                if (attributeID >= 0) {
                    geometry.attributes.push(decodeAttribute(decoder, meshOrCloud, attributeName, attributeType, attribute));
                }
            }
            const metadata = decoder.GetMetadata(meshOrCloud);
            if (metadata.ptr) {
                geometry.metadata = decodeMetadata(metadataQuerier, metadata, metadataTypes);
            }
        } else {
            throw new Error(status.error_msg());
        }

        draco.destroy(meshOrCloud);
        draco.destroy(decoder);
        draco.destroy(buffer);

        return geometry;

    });
}

let draco;
DracoMeshWebDecoder({ wasmBinary })
    .then(draco_ => {
        draco = draco_;
        self.postMessage({ initialized: true });
        self.onmessage = function (evt) {
            try {
                let { drc, configs } = evt.data;
                drcs = (Array.isArray(drc) ? drc : [drc]).filter(drc => drc instanceof ArrayBuffer);

                const geometries = decode(drcs, configs || {}).filter(decoded => !!decoded);
                const transfers = geometries ? [...geometries.reduce((arr, geom) => {
                    return [...arr, ...[geom.index.array.buffer, ...Object.keys(geom.attributes).map(key => geom.attributes[key].array.buffer)]];
                }, [])] : []
                postMessage(geometries, transfers);
            } catch (err) {
                console.log(err);
                postMessage(null);
            }
        }
    });

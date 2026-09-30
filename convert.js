// ===== CONVERSOR OBJ → GLB (Node.js) =====
// Uso: node convert.js [archivo.obj] [salida.glb]
// Requiere: npm install @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { draco, textureCompress, prune, dedup } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import * as fs from 'fs';
import * as path from 'path';

async function convertOBJtoGLB(inputPath, outputPath) {
    console.log(`Convirtiendo: ${inputPath}`);

    // Leer OBJ
    const objText = fs.readFileSync(inputPath, 'utf-8');

    // Crear documento GLTF
    const doc = new Document();
    const buffer = doc.createBuffer();

    // Parsear OBJ básico
    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    const lines = objText.split('\n');
    for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts[0] === 'v') {
            vertices.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
        } else if (parts[0] === 'vn') {
            normals.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
        } else if (parts[0] === 'vt') {
            uvs.push(parseFloat(parts[1]), parseFloat(parts[2]));
        } else if (parts[0] === 'f') {
            // Triangulación simple de polígonos
            for (let i = 1; i < parts.length - 2; i++) {
                const v1 = parts[i].split('/')[0];
                const v2 = parts[i + 1].split('/')[0];
                const v3 = parts[i + 2].split('/')[0];
                indices.push(parseInt(v1) - 1, parseInt(v2) - 1, parseInt(v3) - 1);
            }
        }
    }

    // Crear primitiva
    const position = doc.createAccessor()
        .setType('VEC3')
        .setArray(new Float32Array(vertices))
        .setBuffer(buffer);

    const index = doc.createAccessor()
        .setType('SCALAR')
        .setArray(new Uint32Array(indices))
        .setBuffer(buffer);

    const primitive = doc.createPrimitive()
        .setAttribute('POSITION', position)
        .setIndices(index);

    if (normals.length > 0) {
        const normalAccessor = doc.createAccessor()
            .setType('VEC3')
            .setArray(new Float32Array(normals))
            .setBuffer(buffer);
        primitive.setAttribute('NORMAL', normalAccessor);
    }

    // Crear malla y nodo
    const mesh = doc.createMesh('mesh').addPrimitive(primitive);
    const node = doc.createNode('node').setMesh(mesh);
    const scene = doc.createScene('scene').addChild(node);

    // Optimizar
    await doc.transform(
        dedup(),
        prune(),
        draco()
    );

    // Escribir GLB
    const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
    await io.write(outputPath, doc);

    const stats = fs.statSync(outputPath);
    console.log(`GLB generado: ${outputPath}`);
    console.log(`Tamaño: ${(stats.size / 1024).toFixed(1)} KB`);
}

// Ejecutar
const input = process.argv[2] || '../Banda primera iteración.obj';
const output = process.argv[3] || '../assets/banda-optimizada.glb';

convertOBJtoGLB(input, output).catch(console.error);

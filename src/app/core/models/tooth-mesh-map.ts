export interface ToothMeshInfo {
  meshName: string;      // The name of the mesh/node inside permanent_dentition/scene.gltf
  gltfPath: string;      // Path to the individual tooth GLTF asset
}

export const TOOTH_MESH_MAP: Record<string, ToothMeshInfo> = {
  // Maxillary Right Quadrant (18-11)
  '18': { meshName: 'Tooth_18', gltfPath: '3d/mandibular_third_molar/scene.gltf' }, // Using available similar models if exact one is missing
  '17': { meshName: 'Tooth_17', gltfPath: '3d/mandibular_second_molar/scene.gltf' },
  '16': { meshName: 'Tooth_16', gltfPath: '3d/maxillary_first_molar/scene.gltf' },
  '15': { meshName: 'Tooth_15', gltfPath: '3d/maxillary_second_premolar/scene.gltf' },
  '14': { meshName: 'Tooth_14', gltfPath: '3d/maxillary_first_premolar/scene.gltf' },
  '13': { meshName: 'Tooth_13', gltfPath: '3d/maxillary_canine/scene.gltf' },
  '12': { meshName: 'Tooth_12', gltfPath: '3d/maxillary_lateral_incisor/scene.gltf' },
  '11': { meshName: 'Tooth_11', gltfPath: '3d/maxillary_left_central_incisor/scene.gltf' },

  // Maxillary Left Quadrant (21-28)
  '21': { meshName: 'Tooth_21', gltfPath: '3d/maxillary_left_central_incisor/scene.gltf' },
  '22': { meshName: 'Tooth_22', gltfPath: '3d/maxillary_lateral_incisor/scene.gltf' },
  '23': { meshName: 'Tooth_23', gltfPath: '3d/maxillary_canine/scene.gltf' },
  '24': { meshName: 'Tooth_24', gltfPath: '3d/maxillary_first_premolar/scene.gltf' },
  '25': { meshName: 'Tooth_25', gltfPath: '3d/maxillary_second_premolar/scene.gltf' },
  '26': { meshName: 'Tooth_26', gltfPath: '3d/maxillary_first_molar/scene.gltf' },
  '27': { meshName: 'Tooth_27', gltfPath: '3d/mandibular_second_molar/scene.gltf' },
  '28': { meshName: 'Tooth_28', gltfPath: '3d/mandibular_third_molar/scene.gltf' },

  // Mandibular Left Quadrant (31-38)
  '31': { meshName: 'Tooth_31', gltfPath: '3d/maxillary_left_central_incisor/scene.gltf' },
  '32': { meshName: 'Tooth_32', gltfPath: '3d/maxillary_lateral_incisor/scene.gltf' },
  '33': { meshName: 'Tooth_33', gltfPath: '3d/mandibular_left_canine/scene.gltf' },
  '34': { meshName: 'Tooth_34', gltfPath: '3d/mandibular_first_premolar/scene.gltf' },
  '35': { meshName: 'Tooth_35', gltfPath: '3d/mandibular_left_second_premolar/scene.gltf' },
  '36': { meshName: 'Tooth_36', gltfPath: '3d/mandibular_first_molar/scene.gltf' },
  '37': { meshName: 'Tooth_37', gltfPath: '3d/mandibular_second_molar/scene.gltf' },
  '38': { meshName: 'Tooth_38', gltfPath: '3d/mandibular_third_molar/scene.gltf' },

  // Mandibular Right Quadrant (41-48)
  '41': { meshName: 'Tooth_41', gltfPath: '3d/maxillary_left_central_incisor/scene.gltf' },
  '42': { meshName: 'Tooth_42', gltfPath: '3d/maxillary_lateral_incisor/scene.gltf' },
  '43': { meshName: 'Tooth_43', gltfPath: '3d/mandibular_left_canine/scene.gltf' },
  '44': { meshName: 'Tooth_44', gltfPath: '3d/mandibular_first_premolar/scene.gltf' },
  '45': { meshName: 'Tooth_45', gltfPath: '3d/mandibular_left_second_premolar/scene.gltf' },
  '46': { meshName: 'Tooth_46', gltfPath: '3d/mandibular_first_molar/scene.gltf' },
  '47': { meshName: 'Tooth_47', gltfPath: '3d/mandibular_second_molar/scene.gltf' },
  '48': { meshName: 'Tooth_48', gltfPath: '3d/mandibular_third_molar/scene.gltf' },
};

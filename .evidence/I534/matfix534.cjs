const fs = require("fs");
const p = "E:/Game/.evidence/I534/build_hauler_v2.py";
let s = fs.readFileSync(p, "utf8");
s = s.replace(/\r\n/g, "\n");
const oldStr = '    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; bsdf = nt.nodes["Principled BSDF"]\n    bsdf.inputs["Base Color"].default_value = (0.8, 0.8, 0.8, 1.0); vc = nt.nodes.new("ShaderNodeVertexColor"); vc.layer_name = "Color"\n    nt.links.new(vc.outputs["Color"], bsdf.inputs["Base Color"]); return m';
const newStr = '    m = bpy.data.materials.get(name)\n    if m is None:\n        m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; bsdf = nt.nodes["Principled BSDF"]\n        bsdf.inputs["Base Color"].default_value = (0.8, 0.8, 0.8, 1.0); vc = nt.nodes.new("ShaderNodeVertexColor"); vc.layer_name = "Color"\n        nt.links.new(vc.outputs["Color"], bsdf.inputs["Base Color"])\n    return m';
const n = (s.match(new RegExp(oldStr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
if (n !== 1) { console.log("OLD_MATCH_COUNT", n, "expected 1"); process.exit(1); }
s = s.replace(oldStr, newStr);
s = s.replace(/\n/g, "\r\n");
fs.writeFileSync(p, s);
console.log("MATFIX_OK (get-or-create; sponsons now share VR_SponsonMat -> 4 mats)");
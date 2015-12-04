import pickle
import json

filename = 'embedingData_20spin_nnb.pickle'
with open(filename) as f:
    chimera_all_d3nodecoords,working_qubits_0based, broken_qubits_0based, all_hardware_edges, J_chainNNB_logical,logical_coords_neat,node_sizes_from_emb, embMin,edges_Jemb,edges_Jij = pickle.load(f)

embedDic = {"chimera_all_d3nodecoords" : chimera_all_d3nodecoords,
"working_qubits_0based" : working_qubits_0based,
"broken_qubits_0based" : broken_qubits_0based,
"all_hardware_edges" : all_hardware_edges,
"J_chainNNB_logical" : J_chainNNB_logical,
"logical_coords_neat" : logical_coords_neat,
"node_sizes_from_emb" : node_sizes_from_emb,
"embMin" : embMin,
"edges_Jemb" : edges_Jemb,
"edges_Jij" : edges_Jij}

def listToString(k):
    if type(k) in [type([]), type( () )]: #is a tuple or list?
        return ",".join([str(x) for x in k])
    else:
        return str(k)

#preformat everything into strings
for key,val in embedDic.iteritems():
#     print key, type(val)
    if type(val) == type({}):
#         print key, "dic"
        embedDic[key] = dict([(listToString(k),v) for k,v in val.iteritems()])
    else:
        embedDic[key] = list(val)

#This one requires special processing
embedDic["logical_coords_neat"] = dict([(str(k),list(v)) for k,v in logical_coords_neat.iteritems()])

open("embed.json", "w").write(json.dumps(embedDic))

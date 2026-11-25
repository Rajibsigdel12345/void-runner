# ---- v8 subdivision/band knobs (tune ladder; see run log) ----
V8_HULL_SUBALL = True     # global hull subdiv after bevel1
V8_HULL_BANDA = True      # hull midship band (-0.50, 0.30)
V8_HULL_BANDB = True      # hull core band (-0.15, 0.15)
V8_HULL_BANDC = True      # hull nose band (-1.24, -0.55)
V8_HULL_BANDD = False     # hull tail band (0.30, 0.86) [tune-up lever]
V8_HULL_SUB2A = True      # hull 2nd-pass subdiv on the midship band (-0.50, 0.30) [tune-up]
V8_WING_SUBALL  = True    # wings: global subdiv after bevel1
V8_WING_SUBDIVA = False   # wing band A |x| 0.60..1.60 [tune-up lever]
V8_WING_SUBDIVB = True    # wing band B |x| 0.95..1.35 [tune-up lever]
V8_WING_SUBDIVC = False   # wing band C |x| 1.20..1.50 [tune-up lever]
V8_ENG_SUBDIV   = True    # engine band y > V8_ENG_SUBDIV_Y
V8_ENG_SUBDIV2  = False   # engine band y > V8_ENG_SUBDIV2_Y [fine tune-up]
V8_ENG_SUBDIV3  = False   # engine band y > V8_ENG_SUBDIV3_Y [coarse tune-up]
V8_ENG_SUBDIV_Y   = 1.00
V8_ENG_SUBDIV2_Y  = 1.05
V8_ENG_SUBDIV3_Y  = 0.80
V8_COK_TOPSUB   = True    # cockpit top band z > 1.15, |x| < 0.25
V8_COK_TOPSUB2  = False   # cockpit band z > 1.05, |x| < 0.30 [tune-up]
V8_FIN_SUBALL   = True    # fin: global subdiv after bevel1
V8_FIN_DORSAL   = True    # fin dorsal band z > 0.92
V8_FIN_DORSAL2  = False   # fin dorsal2 band z > 0.75 [tune-up lever]
V8_HULL_SUB2B = True      # hull: nearest-N faces to y=-0.10 within (-0.50,0.30) [sized from run2]
V8_HULL_SUB2B_N = 112
V8_WING_SUB2B = True      # wing: nearest-N faces to |x|=1.10 within (0.75,1.45) [sized from run2]
V8_WING_SUB2B_N = 110
V8_ENG_SUB2B  = False     # engine: nearest-N faces y>0.95 sorted by -y [insurance, off]
V8_ENG_SUB2B_N = 0
V8_COK_SUBALLZ = True      # cockpit: subdivide all faces with center z < V8_COK_SUBALLZ_Z [sized from run3]
V8_COK_SUBALLZ_Z = 1.08

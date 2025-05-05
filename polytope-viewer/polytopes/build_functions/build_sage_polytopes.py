# File: polytopes/build_functions/build_sage_polytopes.py
#
# Contains builder functions for various 3D polytopes available in the
# SageMath standard library (sage.geometry.polyhedron.library.polytopes).
# Each function follows the naming convention 'build_<polytope_name>'
# and returns a tuple: (sage_polyhedron_object, display_name)
#
# Requires: SageMath environment to run generate_jsons.py
# Source: https://doc.sagemath.org/html/en/reference/discrete_geometry/sage/geometry/polyhedron/library.html
# CORRECTED: Using snake_case for Sage library function calls.

try:
    # Import the necessary SageMath library functions
    from sage.geometry.polyhedron.library import polytopes
    # Might need Polyhedron class if constructing manually, but library usually returns it.
    # from sage.all import Polyhedron
except ImportError:
    # This error should ideally be caught by generate_jsons.py,
    # but good practice to anticipate it here too.
    print("ERROR (build_sage_polytopes.py): Could not import SageMath library.")
    print("Ensure this script is used within a SageMath environment.")
    # Define dummy functions if Sage is not available, so generate_jsons can report errors gracefully.
    polytopes = None # Indicate polytopes library is not available

# Helper to prevent errors if Sage isn't loaded when generate_jsons scans
def _placeholder_polytope():
    """Returns None if Sage is not loaded, used as fallback."""
    print("WARNING: Sage library 'polytopes' not loaded. Returning None.")
    return None, "Error: Sage Not Loaded"

# --- Platonic Solids ---

def build_tetrahedron():
    """Builds the standard Tetrahedron."""
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.tetrahedron() # Corrected: snake_case
    name = "Tetrahedron"
    return poly, name

def build_cube():
    """Builds the standard Cube (Hexahedron)."""
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.cube() # Corrected: snake_case
    name = "Cube"
    return poly, name

def build_octahedron():
    """Builds the standard Octahedron."""
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.octahedron() # Corrected: snake_case
    name = "Octahedron"
    return poly, name

def build_dodecahedron():
    """Builds the standard Dodecahedron."""
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.dodecahedron() # Corrected: snake_case
    name = "Dodecahedron"
    return poly, name

def build_icosahedron():
    """Builds the standard Icosahedron."""
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.icosahedron() # Corrected: snake_case
    name = "Icosahedron"
    return poly, name

# --- Basic Dimension-Parametric Polytopes (set to 3D) ---

def build_simplex_3d():
    """Builds the 3-dimensional Simplex (geometrically a Tetrahedron)."""
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.simplex(3) # Corrected: snake_case
    name = "Simplex (3D)"
    return poly, name

def build_cross_polytope_3d():
    """Builds the 3-dimensional Cross Polytope (geometrically an Octahedron)."""
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.cross_polytope(3) # Corrected: snake_case
    name = "Cross Polytope (3D)"
    return poly, name

# --- Prisms and Antiprisms ---

def build_triangular_prism():
    """Builds a Triangular Prism (regular_prism(3))."""
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.regular_prism(3) # Corrected: snake_case
    name = "Triangular Prism"
    return poly, name

# Note: regular_prism(4) is the Cube, already included.

def build_pentagonal_prism():
    """Builds a Pentagonal Prism (regular_prism(5))."""
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.regular_prism(5) # Corrected: snake_case
    name = "Pentagonal Prism"
    return poly, name

def build_hexagonal_prism():
    """Builds a Hexagonal Prism (regular_prism(6))."""
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.regular_prism(6) # Corrected: snake_case
    name = "Hexagonal Prism"
    return poly, name

# Note: regular_antiprism(3) is the Octahedron, already included.

def build_square_antiprism():
    """Builds a Square Antiprism (regular_antiprism(4))."""
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.regular_antiprism(4) # Corrected: snake_case
    name = "Square Antiprism"
    return poly, name

def build_pentagonal_antiprism():
    """Builds a Pentagonal Antiprism (regular_antiprism(5))."""
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.regular_antiprism(5) # Corrected: snake_case
    name = "Pentagonal Antiprism"
    return poly, name

# --- Archimedean Solids ---

def build_truncated_tetrahedron():
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.truncated_tetrahedron() # Corrected: snake_case
    name = "Truncated Tetrahedron"
    return poly, name

def build_cuboctahedron():
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.cuboctahedron() # Corrected: snake_case
    name = "Cuboctahedron"
    return poly, name

def build_truncated_cube():
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.truncated_cube() # Corrected: snake_case
    name = "Truncated Cube"
    return poly, name

def build_truncated_octahedron():
    """Builds the Truncated Octahedron (also the Permutahedron for n=4)."""
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.truncated_octahedron() # Corrected: snake_case
    name = "Truncated Octahedron"
    return poly, name

def build_rhombicuboctahedron(): # Small Rhombicuboctahedron
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.rhombicuboctahedron() # Corrected: snake_case
    name = "Rhombicuboctahedron (Small)"
    return poly, name

def build_truncated_cuboctahedron(): # Great Rhombicuboctahedron
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.truncated_cuboctahedron() # Corrected: snake_case
    name = "Truncated Cuboctahedron (Great Rhombicuboctahedron)"
    return poly, name

def build_icosidodecahedron():
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.icosidodecahedron() # Corrected: snake_case
    name = "Icosidodecahedron"
    return poly, name

def build_truncated_dodecahedron():
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.truncated_dodecahedron() # Corrected: snake_case
    name = "Truncated Dodecahedron"
    return poly, name

def build_truncated_icosahedron(): # Soccer ball
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.truncated_icosahedron() # Corrected: snake_case
    name = "Truncated Icosahedron (Soccer Ball)"
    return poly, name

def build_rhombicosidodecahedron(): # Small Rhombicosidodecahedron
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.rhombicosidodecahedron() # Corrected: snake_case
    name = "Rhombicosidodecahedron (Small)"
    return poly, name

def build_truncated_icosidodecahedron(): # Great Rhombicosidodecahedron
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.truncated_icosidodecahedron() # Corrected: snake_case
    name = "Truncated Icosidodecahedron (Great Rhombicosidodecahedron)"
    return poly, name

def build_snub_cube():
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.snub_cube() # Corrected: snake_case
    name = "Snub Cube"
    return poly, name

def build_snub_dodecahedron():
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.snub_dodecahedron() # Corrected: snake_case
    name = "Snub Dodecahedron"
    return poly, name

# --- Catalan Solids (Duals of Archimedean) ---

def build_triakis_tetrahedron():
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.triakis_tetrahedron() # Corrected: snake_case
    name = "Triakis Tetrahedron"
    return poly, name

def build_rhombic_dodecahedron():
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.rhombic_dodecahedron() # Corrected: snake_case
    name = "Rhombic Dodecahedron"
    return poly, name

def build_triakis_octahedron():
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.triakis_octahedron() # Corrected: snake_case
    name = "Triakis Octahedron"
    return poly, name

def build_tetrakis_hexahedron(): # Tetrakis Cube
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.tetrakis_hexahedron() # Corrected: snake_case
    name = "Tetrakis Hexahedron (Tetrakis Cube)"
    return poly, name

def build_deltoidal_icositetrahedron():
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.deltoidal_icositetrahedron() # Corrected: snake_case
    name = "Deltoidal Icositetrahedron"
    return poly, name

def build_disdyakis_dodecahedron(): # Hexakis Octahedron
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.disdyakis_dodecahedron() # Corrected: snake_case
    name = "Disdyakis Dodecahedron (Hexakis Octahedron)"
    return poly, name

def build_pentagonal_icositetrahedron():
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.pentagonal_icositetrahedron() # Corrected: snake_case
    name = "Pentagonal Icositetrahedron"
    return poly, name

def build_rhombic_triacontahedron():
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.rhombic_triacontahedron() # Corrected: snake_case
    name = "Rhombic Triacontahedron"
    return poly, name

def build_triakis_icosahedron():
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.triakis_icosahedron() # Corrected: snake_case
    name = "Triakis Icosahedron"
    return poly, name

def build_pentakis_dodecahedron():
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.pentakis_dodecahedron() # Corrected: snake_case
    name = "Pentakis Dodecahedron"
    return poly, name

def build_deltoidal_hexecontahedron():
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.deltoidal_hexecontahedron() # Corrected: snake_case
    name = "Deltoidal Hexecontahedron"
    return poly, name

def build_disdyakis_triacontahedron(): # Hexakis Icosahedron
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.disdyakis_triacontahedron() # Corrected: snake_case
    name = "Disdyakis Triacontahedron (Hexakis Icosahedron)"
    return poly, name

def build_pentagonal_hexecontahedron():
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.pentagonal_hexecontahedron() # Corrected: snake_case
    name = "Pentagonal Hexecontahedron"
    return poly, name

# --- Johnson Solids (Examples) ---
# There are 92 Johnson solids (J1 to J92). Adding a few examples.

def build_johnson_J1_square_pyramid():
    """Builds Johnson Solid J1 (Square Pyramid)."""
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.johnson_solid(1) # Corrected: snake_case
    name = "Johnson Solid J1 (Square Pyramid)"
    return poly, name

def build_johnson_J2_pentagonal_pyramid():
    """Builds Johnson Solid J2 (Pentagonal Pyramid)."""
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.johnson_solid(2) # Corrected: snake_case
    name = "Johnson Solid J2 (Pentagonal Pyramid)"
    return poly, name

def build_johnson_J4_square_cupola():
    """Builds Johnson Solid J4 (Square Cupola)."""
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.johnson_solid(4) # Corrected: snake_case
    name = "Johnson Solid J4 (Square Cupola)"
    return poly, name

def build_johnson_J91_bilunabirotunda():
    """Builds Johnson Solid J91 (Bilunabirotunda)."""
    if not polytopes: return _placeholder_polytope()
    poly = polytopes.johnson_solid(91) # Corrected: snake_case
    name = "Johnson Solid J91 (Bilunabirotunda)"
    return poly, name


# --- Other Named Polytopes (requiring parameter for 3D) ---

def build_associahedron_k4():
    """Builds the 3-dimensional Associahedron (Stasheff Polytope) for k=4."""
    if not polytopes: return _placeholder_polytope()
    # Associahedron(k) is (k-1)-dimensional, so k=4 yields 3D.
    poly = polytopes.associahedron(4) # Corrected: snake_case
    name = "Associahedron (3D, k=4)"
    return poly, name

def build_cyclohedron_k4():
    """Builds the 3-dimensional Cyclohedron for k=4."""
    if not polytopes: return _placeholder_polytope()
    # Cyclohedron(k) is (k-1)-dimensional, so k=4 yields 3D.
    poly = polytopes.cyclohedron(4) # Corrected: snake_case
    name = "Cyclohedron (3D, k=4)"
    return poly, name

def build_permutahedron_n4():
     """Builds the 3-dimensional Permutahedron for n=4 (geometrically a Truncated Octahedron)."""
     if not polytopes: return _placeholder_polytope()
     # Permutahedron(n) is (n-1)-dimensional, so n=4 yields 3D.
     poly = polytopes.permutahedron(4) # Corrected: snake_case
     name = "Permutahedron (3D, n=4)"
     return poly, name

# Note: StasheffPolytope(n) is the same as Associahedron(n).

def build_tesler_polytope_n3():
     """Builds the 3-dimensional Tesler Polytope for n=3."""
     if not polytopes: return _placeholder_polytope()
     # TeslerPolytope(n) has dimension n(n-1)/2. n=3 gives dim 3.
     poly = polytopes.tesler_polytope(3) # Corrected: snake_case
     name = "Tesler Polytope (3D, n=3)"
     return poly, name

# Note: BirkhoffPolytope(n) has dimension (n-1)^2. No integer n yields dimension 3.
# The documentation lists 'birkhoff_polytope', but it won't produce 3D.

# --- END OF BUILD FUNCTIONS ---

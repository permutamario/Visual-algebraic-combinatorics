# Requires SageMath environment
from sage.all import polytopes

def build():
    """Constructs the Truncated Octahedron (Permutahedron P3)."""
    # Using the name expected by the previous JSON file list
    polytope_obj = polytopes.truncated_octahedron()
    display_name = "Permutahedron P3 (Truncated Octahedron)"
    print(f"--- Built Sage Object: {display_name}")
    return polytope_obj, display_name

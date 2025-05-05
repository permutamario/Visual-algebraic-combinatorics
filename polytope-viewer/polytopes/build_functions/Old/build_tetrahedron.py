# Requires SageMath environment
from sage.all import polytopes

def build():
    """Constructs the standard Tetrahedron Polyhedron."""
    polytope_obj = polytopes.tetrahedron()
    display_name = "Tetrahedron"
    print(f"--- Built Sage Object: {display_name}")
    return polytope_obj, display_name

# Requires SageMath environment
from sage.all import polytopes

def build():
    """Constructs the standard Cube Polyhedron."""
    polytope_obj = polytopes.cube()
    display_name = "Cube"
    print(f"--- Built Sage Object: {display_name}")
    return polytope_obj, display_name

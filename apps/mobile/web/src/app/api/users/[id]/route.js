import sql from "@/app/api/utils/sql";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const [user] = await sql`SELECT * FROM users WHERE id = ${id}`;
    
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return Response.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { name, avatar_url } = await request.json();
    
    if (!name) {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }

    const [user] = await sql`
      UPDATE users 
      SET name = ${name}, avatar_url = ${avatar_url || null}
      WHERE id = ${id}
      RETURNING *
    `;

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({ user });
  } catch (error) {
    console.error('Error updating user:', error);
    return Response.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    const [deletedUser] = await sql`
      DELETE FROM users WHERE id = ${id} RETURNING *
    `;

    if (!deletedUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({ 
      message: 'User deleted successfully',
      user: deletedUser 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return Response.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
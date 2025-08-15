import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const users = await sql`SELECT * FROM users ORDER BY created_at ASC`;
    return Response.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return Response.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, avatar_url } = await request.json();
    
    if (!name) {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }

    const [user] = await sql`
      INSERT INTO users (name, avatar_url) 
      VALUES (${name}, ${avatar_url || null}) 
      RETURNING *
    `;

    return Response.json({ user });
  } catch (error) {
    console.error('Error creating user:', error);
    return Response.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
package daniel.uclm.esi.gramola.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class Token {
	@Id @Column(length = 36)
	private String id;
	private long creationTime;
	private Long usedTime;

	public Token() {
		this.id = java.util.UUID.randomUUID().toString();
		this.creationTime = System.currentTimeMillis();
		this.usedTime = null;
	}

	public String getID() {
		return this.id;
	}

	public void setID(String id) {
		this.id = id;
	}

	public long getCreationDate() {
		return this.creationTime;
	}

	public void setCreationTime(long creationTime) {
		this.creationTime = creationTime;
	}

	public boolean isUsed() {
		return this.usedTime > 0;
	}

	public void setUsedTime() {
		this.usedTime = System.currentTimeMillis();
	}

	public boolean equals(String tokenID) {
		return this.id.equals(tokenID);
	}

	@Override
	public boolean equals(Object obj) {
		if (obj instanceof String) {
			return this.id.equals(obj);
		}
		if (obj instanceof Token) {
			return this.id.equals(((Token) obj).id);
		}
		return false;
	}

	@Override
	public int hashCode() {
		return this.id.hashCode();
	}
	
}

package daniel.uclm.esi.gramola.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class Token {
	@Id @Column(length = 36)
	private String id;
	private long creationTime;
	private long usedTime = 0;

	public Token() {
		this.id = java.util.UUID.randomUUID().toString();
		this.creationTime = System.currentTimeMillis();
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
		return this.usedTime != 0;
	}

	public void setUsedTime() {
		this.usedTime = System.currentTimeMillis();
	}

	public boolean equals(String tokenID) {
		return this.id.equals(tokenID);
	}
	
}

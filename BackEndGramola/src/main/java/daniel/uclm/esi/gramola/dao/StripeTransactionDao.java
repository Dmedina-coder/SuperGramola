package daniel.uclm.esi.gramola.dao;

import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;

import daniel.uclm.esi.gramola.models.StripeTransaction;

@Repository
public interface StripeTransactionDao extends JpaRepository <StripeTransaction, String> {

}

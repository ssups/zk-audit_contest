#[oracle(getVerify)]
unconstrained fn verify(a: Field, b: Field, c: Field) -> bool {}

unconstrained fn get_verify(a: Field, b: Field, c: Field) -> bool {
    // verify(contracts)
    verify(a, b, c)
}

fn main(exploit_contract: Field, value: Field, target_contract: pub Field) {
    // let result = unsafe { get_verify([exploit_contract, target_contract, value]) };
    let result = unsafe { get_verify(exploit_contract, target_contract, value) };
    assert_eq(result, true, "Verification failed");
}

// #[test]
// fn test_main() {
//     main(1, 2);
// }
